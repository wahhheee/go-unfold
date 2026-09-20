package flow

import (
	"errors"
	"io"
	"net"
	"os"
	"testing"
	"time"
)

func TestWriteBeforeApplicationRead(t *testing.T) {
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	if err = listener.(*net.TCPListener).SetDeadline(time.Now().Add(3 * time.Second)); err != nil {
		t.Fatal(err)
	}
	accepted := make(chan net.Conn, 1)
	failures := make(chan error, 1)
	go func() {
		c, err := listener.Accept()
		if err != nil {
			failures <- err
			return
		}
		accepted <- c
	}()
	client, err := net.DialTimeout("tcp4", listener.Addr().String(), time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()
	var server net.Conn
	select {
	case server = <-accepted:
	case err := <-failures:
		t.Fatal(err)
	case <-time.After(3 * time.Second):
		t.Fatal("接受连接超时")
	}
	defer server.Close()
	if err = client.SetWriteDeadline(time.Now().Add(time.Second)); err != nil {
		t.Fatal(err)
	}
	// 服务端尚未调用 Read；小写入仍可被本地 TCP 接受。
	if _, err = client.Write([]byte("x")); err != nil {
		t.Fatal(err)
	}
	if err = server.SetReadDeadline(time.Now().Add(-time.Second)); err != nil {
		t.Fatal(err)
	}
	var b [1]byte
	if _, err = server.Read(b[:]); !errors.Is(err, os.ErrDeadlineExceeded) {
		t.Fatalf("预期期限错误：%v", err)
	}
	if err = server.SetReadDeadline(time.Time{}); err != nil {
		t.Fatal(err)
	}
	// 测试自身仍设置安全上限；清除旧期限并不会丢弃已传输数据。
	if err = server.SetReadDeadline(time.Now().Add(time.Second)); err != nil {
		t.Fatal(err)
	}
	if _, err = io.ReadFull(server, b[:]); err != nil || b[0] != 'x' {
		t.Fatalf("恢复读取：%q %v", b, err)
	}
}
