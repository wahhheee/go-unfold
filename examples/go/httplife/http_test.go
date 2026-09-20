package httplife

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"net/http/httptrace"
	"sync/atomic"
	"testing"
	"time"
)

func TestStatusReuseAndBoundedDrain(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Length", "5")
		w.WriteHeader(500)
		_, _ = io.WriteString(w, "error")
	}))
	defer server.Close()
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.MaxConnsPerHost = 1
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, Timeout: 2 * time.Second}
	for i := 0; i < 3; i++ {
		var reused atomic.Bool
		req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, server.URL, nil)
		if err != nil {
			t.Fatal(err)
		}
		req = req.WithContext(httptrace.WithClientTrace(req.Context(), &httptrace.ClientTrace{GotConn: func(info httptrace.GotConnInfo) { reused.Store(info.Reused) }}))
		resp, err := client.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		if resp.StatusCode != 500 {
			t.Fatal(resp.StatusCode)
		}
		if i > 0 && !reused.Load() {
			t.Fatal("同一可用连接应被复用")
		}
		if i != 1 {
			if _, err = io.Copy(io.Discard, resp.Body); err != nil {
				resp.Body.Close()
				t.Fatal(err)
			}
		}
		// 第二次故意不手动读取，验证 Go 1.27.1 小响应的有限后台排空。
		if err = resp.Body.Close(); err != nil {
			t.Fatal(err)
		}
	}
}

func TestHeadersBeforeBody(t *testing.T) {
	release := make(chan struct{})
	defer close(release)
	exited := make(chan struct{})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer close(exited)
		w.Header().Set("Content-Length", "4")
		w.WriteHeader(200)
		w.(http.Flusher).Flush()
		select {
		case <-release:
			_, _ = io.WriteString(w, "done")
		case <-r.Context().Done():
		}
	}))
	defer server.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, server.URL, nil)
	if err != nil {
		t.Fatal(err)
	}
	transport := http.DefaultTransport.(*http.Transport).Clone()
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, Timeout: 2 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	if resp.ContentLength != 4 {
		t.Fatal(resp.ContentLength)
	}
	// 体尚未获准发送，Do 已返回；取消会中断后续读取。
	cancel()
	_, err = io.ReadAll(resp.Body)
	resp.Body.Close()
	if err == nil {
		t.Fatal("未收齐响应体不能当成成功")
	}
	select {
	case <-exited:
	case <-time.After(3 * time.Second):
		t.Fatal("服务端没有响应取消")
	}
}
