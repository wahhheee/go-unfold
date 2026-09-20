package requestlife

import (
	"context"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/http/httptrace"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func waitEvent(t *testing.T, ch <-chan struct{}) {
	t.Helper()
	select {
	case <-ch:
	case <-time.After(5 * time.Second):
		t.Fatal("等待事件超时")
	}
}
func waitError(t *testing.T, ch <-chan error) error {
	t.Helper()
	select {
	case err := <-ch:
		return err
	case <-time.After(5 * time.Second):
		t.Fatal("等待任务退出超时")
		return nil
	}
}

func TestCancellationDoesNotUndoCommit(t *testing.T) {
	var commits atomic.Int32
	committed, handlerDone := make(chan struct{}), make(chan struct{})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer close(handlerDone)
		commits.Add(1)
		close(committed)
		<-r.Context().Done()
	}))
	defer server.Close()
	transport := &http.Transport{}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, Timeout: 3 * time.Second}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, server.URL, nil)
	if err != nil {
		t.Fatal(err)
	}
	result := make(chan error, 1)
	go func() {
		resp, err := client.Do(req)
		if resp != nil {
			resp.Body.Close()
		}
		result <- err
	}()
	waitEvent(t, committed)
	cancel()
	if err := waitError(t, result); !errors.Is(err, context.Canceled) {
		t.Fatalf("客户端取消结果：%v", err)
	}
	waitEvent(t, handlerDone)
	if got := commits.Load(); got != 1 {
		t.Fatalf("取消不应撤销已经完成的提交：%d", got)
	}
}

func TestTraceExplainsConnectionReuse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { _, _ = io.WriteString(w, "ok") }))
	defer server.Close()
	transport := &http.Transport{MaxIdleConnsPerHost: 1}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, Timeout: 3 * time.Second}
	var mu sync.Mutex
	var reused []bool
	var connects, written, firstBytes int
	trace := &httptrace.ClientTrace{
		GotConn:      func(info httptrace.GotConnInfo) { mu.Lock(); defer mu.Unlock(); reused = append(reused, info.Reused) },
		ConnectStart: func(_, _ string) { mu.Lock(); defer mu.Unlock(); connects++ },
		WroteRequest: func(info httptrace.WroteRequestInfo) {
			mu.Lock()
			defer mu.Unlock()
			if info.Err == nil {
				written++
			}
		},
		GotFirstResponseByte: func() { mu.Lock(); defer mu.Unlock(); firstBytes++ },
	}
	for i := 0; i < 2; i++ {
		ctx := httptrace.WithClientTrace(context.Background(), trace)
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, server.URL, nil)
		if err != nil {
			t.Fatal(err)
		}
		resp, err := client.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		_, readErr := io.Copy(io.Discard, resp.Body)
		closeErr := resp.Body.Close()
		if readErr != nil || closeErr != nil {
			t.Fatalf("响应收尾：%v / %v", readErr, closeErr)
		}
	}
	mu.Lock()
	defer mu.Unlock()
	if len(reused) != 2 || reused[0] || !reused[1] || connects != 1 || written != 2 || firstBytes != 2 {
		t.Fatalf("追踪：复用=%v，拨号=%d，发送=%d，首字节=%d", reused, connects, written, firstBytes)
	}
}

func TestShutdownWaitsForActiveRequest(t *testing.T) {
	entered, release, handlerDone := make(chan struct{}), make(chan struct{}), make(chan struct{})
	var releaseOnce sync.Once
	unblock := func() { releaseOnce.Do(func() { close(release) }) }
	server := &http.Server{Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer close(handlerDone)
		close(entered)
		select {
		case <-release:
			_, _ = io.WriteString(w, "完成")
		case <-r.Context().Done():
		}
	})}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer server.Close()
	defer unblock()
	serveDone := make(chan error, 1)
	go func() { serveDone <- server.Serve(listener) }()
	transport := &http.Transport{}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, Timeout: 4 * time.Second}
	requestDone := make(chan error, 1)
	go func() {
		resp, err := client.Get("http://" + listener.Addr().String())
		if err == nil {
			_, err = io.Copy(io.Discard, resp.Body)
			resp.Body.Close()
		}
		requestDone <- err
	}()
	waitEvent(t, entered)
	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
	defer cancel()
	shutdownDone := make(chan error, 1)
	go func() { shutdownDone <- server.Shutdown(ctx) }()
	if err := waitError(t, serveDone); !errors.Is(err, http.ErrServerClosed) {
		t.Fatalf("Serve 结果：%v", err)
	}
	select {
	case err := <-shutdownDone:
		t.Fatalf("活跃请求未释放，不应完成 Shutdown：%v", err)
	default:
	}
	unblock()
	waitEvent(t, handlerDone)
	if err := waitError(t, requestDone); err != nil {
		t.Fatal(err)
	}
	if err := waitError(t, shutdownDone); err != nil {
		t.Fatal(err)
	}
}
