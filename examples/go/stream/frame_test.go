package stream

import (
	"bytes"
	"encoding/binary"
	"errors"
	"io"
	"net"
	"testing"
	"time"
)

type shortReader struct {
	io.Reader
	limit int
}

func (r shortReader) Read(p []byte) (int, error) {
	if len(p) > r.limit {
		p = p[:r.limit]
	}
	return r.Reader.Read(p)
}
func frame(s string) []byte {
	b := make([]byte, 4)
	binary.BigEndian.PutUint32(b, uint32(len(s)))
	return append(b, []byte(s)...)
}
func TestFraming(t *testing.T) {
	for size := 1; size <= 12; size++ {
		r := shortReader{bytes.NewReader(append(frame("CAT"), frame("OK")...)), size}
		for _, want := range []string{"CAT", "OK"} {
			got, err := ReadFrame(r)
			if err != nil || string(got) != want {
				t.Fatalf("粒度 %d：%q %v", size, got, err)
			}
		}
		if _, err := ReadFrame(r); !errors.Is(err, io.EOF) {
			t.Fatal(err)
		}
	}
	if _, err := ReadFrame(bytes.NewReader(frame("OK")[:5])); !errors.Is(err, io.ErrUnexpectedEOF) {
		t.Fatal(err)
	}
	if _, err := ReadFrame(bytes.NewReader([]byte{0xff, 0xff, 0xff, 0xff})); err == nil {
		t.Fatal("必须在分配前拒绝超大长度")
	}
	if b, err := ReadFrame(bytes.NewReader(frame(""))); err != nil || len(b) != 0 {
		t.Fatal(b, err)
	}
}

func TestHalfClose(t *testing.T) {
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	if err := listener.(*net.TCPListener).SetDeadline(time.Now().Add(3 * time.Second)); err != nil {
		t.Fatal(err)
	}
	done := make(chan error, 1)
	go func() {
		conn, err := listener.Accept()
		if err != nil {
			done <- err
			return
		}
		defer conn.Close()
		if err = conn.SetDeadline(time.Now().Add(2 * time.Second)); err != nil {
			done <- err
			return
		}
		body, err := io.ReadAll(conn)
		if err != nil {
			done <- err
			return
		}
		if string(body) != "question" {
			done <- errors.New("请求内容不符")
			return
		}
		_, err = conn.Write([]byte("answer"))
		done <- err
	}()
	conn, err := net.DialTimeout("tcp4", listener.Addr().String(), time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	if err = conn.SetDeadline(time.Now().Add(2 * time.Second)); err != nil {
		t.Fatal(err)
	}
	if _, err = conn.Write([]byte("question")); err != nil {
		t.Fatal(err)
	}
	if err = conn.(*net.TCPConn).CloseWrite(); err != nil {
		t.Fatal(err)
	}
	response, err := io.ReadAll(conn)
	if err != nil || string(response) != "answer" {
		t.Fatalf("半关闭后的响应：%q %v", response, err)
	}
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}
