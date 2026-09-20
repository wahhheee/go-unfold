package multiplex

import (
	"context"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/http/httptrace"
	"sync"
	"testing"
	"time"
)

func TestIndependentHTTP2Streams(t *testing.T) {
	entered := make(chan struct{})
	exited := make(chan struct{})
	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/slow" {
			close(entered)
			<-r.Context().Done()
			close(exited)
			return
		}
		_, _ = io.WriteString(w, "fast")
	}))
	server.EnableHTTP2 = true
	server.StartTLS()
	defer server.Close()
	client := server.Client()
	client.Timeout = 3 * time.Second
	transport := client.Transport.(*http.Transport)
	transport.MaxConnsPerHost = 1
	defer transport.CloseIdleConnections()
	var mu sync.Mutex
	var connections []net.Conn
	trace := &httptrace.ClientTrace{GotConn: func(info httptrace.GotConnInfo) { mu.Lock(); connections = append(connections, info.Conn); mu.Unlock() }}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	slow, err := http.NewRequestWithContext(httptrace.WithClientTrace(ctx, trace), http.MethodGet, server.URL+"/slow", nil)
	if err != nil {
		t.Fatal(err)
	}
	done := make(chan error, 1)
	go func() {
		resp, err := client.Do(slow)
		if resp != nil {
			resp.Body.Close()
		}
		done <- err
	}()
	select {
	case <-entered:
	case <-ctx.Done():
		t.Fatal("慢流未进入")
	}
	fast, err := http.NewRequestWithContext(httptrace.WithClientTrace(ctx, trace), http.MethodGet, server.URL+"/fast", nil)
	if err != nil {
		t.Fatal(err)
	}
	resp, err := client.Do(fast)
	if err != nil {
		t.Fatal(err)
	}
	body, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil || string(body) != "fast" || resp.ProtoMajor != 2 {
		t.Fatalf("快流结果：%q %s %v", body, resp.Proto, err)
	}
	mu.Lock()
	same := len(connections) == 2 && connections[0] == connections[1]
	mu.Unlock()
	if !same {
		t.Fatal("两个并发流未复用同一连接")
	}
	cancel()
	select {
	case err := <-done:
		if err == nil {
			t.Fatal("慢流取消应返回错误")
		}
	case <-time.After(3 * time.Second):
		t.Fatal("客户端未退出")
	}
	select {
	case <-exited:
	case <-time.After(3 * time.Second):
		t.Fatal("服务端未退出")
	}
}
