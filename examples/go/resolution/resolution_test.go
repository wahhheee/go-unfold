package resolution

import (
	"context"
	"encoding/binary"
	"errors"
	"io"
	"net"
	"testing"
	"time"
)

// 受控 TCP DNS 应答，保留问题段，只回答 example.test. 的 A 查询。
func TestControlledResolver(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	finished := make(chan error, 1)
	resolver := &net.Resolver{PreferGo: true, Dial: func(ctx context.Context, _, _ string) (net.Conn, error) {
		client, server := net.Pipe()
		go func() {
			defer server.Close()
			err := server.SetDeadline(time.Now().Add(time.Second))
			if err != nil {
				finished <- err
				return
			}
			var size [2]byte
			if _, err = io.ReadFull(server, size[:]); err != nil {
				finished <- err
				return
			}
			query := make([]byte, binary.BigEndian.Uint16(size[:]))
			if _, err = io.ReadFull(server, query); err != nil {
				finished <- err
				return
			}
			// 问题名逐标签跳过，排除可选 OPT 附加记录。
			end := 12
			for end < len(query) && query[end] != 0 {
				end += int(query[end]) + 1
			}
			end += 5
			if end > len(query) {
				finished <- io.ErrUnexpectedEOF
				return
			}
			answer := append([]byte(nil), query[:end]...)
			binary.BigEndian.PutUint16(answer[2:4], 0x8180)
			binary.BigEndian.PutUint16(answer[6:8], 1)
			binary.BigEndian.PutUint16(answer[8:10], 0)
			binary.BigEndian.PutUint16(answer[10:12], 0)
			answer = append(answer, 0xc0, 0x0c, 0, 1, 0, 1, 0, 0, 0, 30, 0, 4, 192, 0, 2, 10)
			binary.BigEndian.PutUint16(size[:], uint16(len(answer)))
			_, err = server.Write(append(size[:], answer...))
			finished <- err
		}()
		return client, nil
	}}
	ips, err := resolver.LookupNetIP(ctx, "ip4", "example.test.")
	if err != nil {
		t.Fatal(err)
	}
	if len(ips) != 1 || ips[0].String() != "192.0.2.10" {
		t.Fatalf("地址不符：%v", ips)
	}
	if err := <-finished; err != nil {
		t.Fatal(err)
	}
}

func TestCanceledResolution(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	resolver := &net.Resolver{PreferGo: true, Dial: func(ctx context.Context, _, _ string) (net.Conn, error) {
		return nil, ctx.Err()
	}}
	_, err := resolver.LookupNetIP(ctx, "ip4", "cancel.example.test.")
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("应保留取消原因：%v", err)
	}
}
