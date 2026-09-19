package scheduler

import (
	"context"
	"fmt"
	"runtime"
	"runtime/pprof"
	"testing"
	"time"
)

func start(ctx context.Context) <-chan struct{} {
	done := make(chan struct{})
	go func() { defer close(done); <-ctx.Done() }()
	return done
}
func Example_cancelAndJoin() {
	ctx, cancel := context.WithCancel(context.Background())
	done := start(ctx)
	cancel()
	<-done
	fmt.Println("已确认退出")
	// Output: 已确认退出
}
func TestBlockedGAllowsProgress(t *testing.T) {
	previous := runtime.GOMAXPROCS(1)
	defer runtime.GOMAXPROCS(previous)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	ready := make(chan struct{})
	done := make(chan struct{})
	go func() { defer close(done); close(ready); <-ctx.Done() }()
	select {
	case <-ready:
	case <-time.After(3 * time.Second):
		t.Fatal("任务未启动")
	}
	progress := make(chan struct{})
	go func() { close(progress) }()
	select {
	case <-progress:
	case <-time.After(3 * time.Second):
		t.Fatal("单 P 下其他就绪任务未前进")
	}
	cancel()
	select {
	case <-done:
	case <-time.After(3 * time.Second):
		t.Fatal("取消后任务未退出")
	}
}
func TestLeakProfileAvailable(t *testing.T) {
	if pprof.Lookup("goroutineleak") == nil {
		t.Fatal("Go 1.27 应提供 goroutineleak 画像")
	}
}
