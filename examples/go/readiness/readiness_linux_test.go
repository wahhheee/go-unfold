package readiness

import (
	"errors"
	"net"
	"syscall"
	"testing"
	"time"
)

func TestRealEpollPartialRead(t *testing.T) {
	for _, edge := range []bool{false, true} {
		name := "LT"
		if edge {
			name = "ET"
		}
		t.Run(name, func(t *testing.T) {
			pipe := make([]int, 2)
			if err := syscall.Pipe2(pipe, syscall.O_NONBLOCK|syscall.O_CLOEXEC); err != nil {
				t.Fatal(err)
			}
			defer syscall.Close(pipe[0])
			defer syscall.Close(pipe[1])
			ep, err := syscall.EpollCreate1(syscall.EPOLL_CLOEXEC)
			if err != nil {
				t.Fatal(err)
			}
			defer syscall.Close(ep)
			flags := uint32(syscall.EPOLLIN)
			if edge {
				flags |= 1 << 31
			}
			if err := syscall.EpollCtl(ep, syscall.EPOLL_CTL_ADD, pipe[0], &syscall.EpollEvent{Events: flags, Fd: int32(pipe[0])}); err != nil {
				t.Fatal(err)
			}
			wait := func() int {
				t.Helper()
				events := make([]syscall.EpollEvent, 1)
				deadline := time.Now().Add(time.Second)
				for time.Now().Before(deadline) {
					n, err := syscall.EpollWait(ep, events, 0)
					if err == syscall.EINTR {
						continue
					}
					if err != nil {
						t.Fatal(err)
					}
					if n == 1 && events[0].Fd != int32(pipe[0]) {
						t.Fatal("就绪对象不匹配")
					}
					return n
				}
				t.Fatal("EINTR 重试超时")
				return 0
			}
			write := func(data string) {
				t.Helper()
				n, err := syscall.Write(pipe[1], []byte(data))
				if err != nil || n != len(data) {
					t.Fatalf("写入 %d: %v", n, err)
				}
			}
			write("ABCD")
			if wait() != 1 {
				t.Fatal("首次写入应可读")
			}
			buf := make([]byte, 2)
			n, err := syscall.Read(pipe[0], buf)
			if err != nil || n != 2 || string(buf) != "AB" {
				t.Fatalf("部分读取 %q: %v", buf, err)
			}
			want := 1
			if edge {
				want = 0
			}
			if got := wait(); got != want {
				t.Fatalf("部分读取后事件数 %d，期望 %d", got, want)
			}
			n, err = syscall.Read(pipe[0], buf)
			if err != nil || n != 2 || string(buf) != "CD" {
				t.Fatalf("残留字节 %q: %v", buf, err)
			}
			if _, err := syscall.Read(pipe[0], buf); err != syscall.EAGAIN {
				t.Fatalf("排空后应 EAGAIN，得到 %v", err)
			}
			if wait() != 0 {
				t.Fatal("排空后不应仍可读")
			}
			write("EF")
			if wait() != 1 {
				t.Fatal("再次写入应产生新的就绪")
			}
		})
	}
}

func TestCloseReleasesTCPReader(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	client, err := net.DialTimeout("tcp", listener.Addr().String(), time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()
	server, err := listener.Accept()
	if err != nil {
		t.Fatal(err)
	}
	defer server.Close()
	if err := client.SetReadDeadline(time.Now().Add(2 * time.Second)); err != nil {
		t.Fatal(err)
	}
	started, done := make(chan struct{}), make(chan error, 1)
	go func() { close(started); _, err := client.Read(make([]byte, 1)); done <- err }()
	<-started
	if err := client.Close(); err != nil {
		t.Fatal(err)
	}
	select {
	case err := <-done:
		if !errors.Is(err, net.ErrClosed) {
			t.Fatalf("读取应因 Close 结束，得到 %v", err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("读取未退出")
	}
	// 不通过睡眠推测 G 的内部调度时刻，只验证关闭后的 API 结果并等待退出。
}
