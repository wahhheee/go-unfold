package taskgroups

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"

	"golang.org/x/sync/errgroup"
	"golang.org/x/sync/singleflight"
)

func TestErrorCancelsButWaitStillJoins(t *testing.T) {
	group, ctx := errgroup.WithContext(context.Background())
	ready, cleanup := make(chan struct{}), make(chan struct{})
	failure := errors.New("依赖失败")
	var joined atomic.Bool
	group.Go(func() error { <-ready; return failure })
	group.Go(func() error { close(ready); <-ctx.Done(); <-cleanup; joined.Store(true); return ctx.Err() })
	result := make(chan error, 1)
	go func() { result <- group.Wait() }()
	<-ctx.Done()
	var got error
	returned := false
	select {
	case got = <-result:
		returned = true
		t.Error("Wait 在其他任务清理前返回")
	default:
	}
	close(cleanup)
	if !returned {
		got = <-result
	}
	if got != failure {
		t.Fatalf("首个错误=%v", got)
	}
	if !joined.Load() {
		t.Fatal("未等待清理完成")
	}
	if context.Cause(ctx) != failure {
		t.Fatal("派生取消原因未保留首个错误")
	}
}

func TestSuccessfulWaitCancelsDerivedContext(t *testing.T) {
	group, ctx := errgroup.WithContext(context.Background())
	group.Go(func() error { return nil })
	if err := group.Wait(); err != nil {
		t.Fatal(err)
	}
	if ctx.Err() != context.Canceled {
		t.Fatal("成功 Wait 后派生 Context 未取消")
	}
}

func TestParentCancellationIsNotAutomaticallyAGroupError(t *testing.T) {
	parent, cancel := context.WithCancel(context.Background())
	group, ctx := errgroup.WithContext(parent)
	cancel()
	group.Go(func() error { return nil })
	if err := group.Wait(); err != nil {
		t.Fatal("Wait 不应凭空生成任务错误")
	}
	if ctx.Err() != context.Canceled {
		t.Fatal("父取消未传播")
	}
}

func TestTryGoDoesNotQueueWhenLimitFull(t *testing.T) {
	var group errgroup.Group
	group.SetLimit(1)
	release := make(chan struct{})
	group.Go(func() error { <-release; return nil })
	if group.TryGo(func() error { t.Error("不应启动额外任务"); return nil }) {
		t.Error("超出并发上限")
	}
	close(release)
	if err := group.Wait(); err != nil {
		t.Fatal(err)
	}
}

func TestPipelineEarlyExitCancelsBlockedSenders(t *testing.T) {
	parent, cancel := context.WithCancel(context.Background())
	defer cancel()
	group, ctx := errgroup.WithContext(parent)
	input, output := make(chan int), make(chan int)
	group.Go(func() error {
		defer close(input)
		for value := range 10 {
			select {
			case input <- value:
			case <-ctx.Done():
				return ctx.Err()
			}
		}
		return nil
	})
	group.Go(func() error {
		defer close(output)
		for {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case value, ok := <-input:
				if !ok {
					return nil
				}
				select {
				case output <- value * value:
				case <-ctx.Done():
					return ctx.Err()
				}
			}
		}
	})
	if first := <-output; first != 0 {
		t.Fatalf("首值=%d", first)
	}
	cancel()
	if err := group.Wait(); !errors.Is(err, context.Canceled) {
		t.Fatalf("取消后结果=%v", err)
	}
}

func TestSingleflightSharesOnlyOverlappingCalls(t *testing.T) {
	var group singleflight.Group
	var calls atomic.Int32
	started, release := make(chan struct{}), make(chan struct{})
	load := func() (any, error) {
		if calls.Add(1) == 1 {
			close(started)
			<-release
		}
		return "配置", nil
	}
	first := group.DoChan("tenant:1:config:v1", load)
	<-started
	second := group.DoChan("tenant:1:config:v1", load)
	close(release)
	for _, ch := range []<-chan singleflight.Result{first, second} {
		result := <-ch
		if result.Val != "配置" || result.Err != nil || !result.Shared {
			t.Fatalf("未共享结果：%+v", result)
		}
		select {
		case _, ok := <-ch:
			if !ok {
				t.Error("DoChan 的返回通道不应关闭")
			} else {
				t.Error("不应有第二个结果")
			}
		default:
		}
	}
	if calls.Load() != 1 {
		t.Fatal("重叠调用重复执行")
	}
	_, err, shared := group.Do("tenant:1:config:v1", load)
	if err != nil || shared || calls.Load() != 2 {
		t.Fatal("完成之后不应仍被当作缓存")
	}
}

func TestOneWaiterCancelDoesNotCancelSharedWork(t *testing.T) {
	var group singleflight.Group
	started, release := make(chan struct{}), make(chan struct{})
	load := func() (any, error) { close(started); <-release; return 42, nil }
	first := group.DoChan("same-key", load)
	<-started
	second := group.DoChan("same-key", load)
	caller, cancel := context.WithCancel(context.Background())
	cancel()
	select {
	case <-caller.Done():
	case <-first:
		t.Error("共享工作还没有完成")
	}
	close(release)
	if result := <-second; result.Val != 42 || result.Err != nil {
		t.Fatal("其他等待者没有得到结果")
	}
	if result := <-first; result.Val != 42 {
		t.Fatal("被放弃的等待不会阻止缓冲结果投递")
	}
}

func TestForgetPermitsOverlapWithoutCancelingOldCall(t *testing.T) {
	var group singleflight.Group
	var calls atomic.Int32
	started, release := make(chan int32, 2), make(chan struct{})
	load := func() (any, error) { id := calls.Add(1); started <- id; <-release; return id, nil }
	first := group.DoChan("key", load)
	<-started
	group.Forget("key")
	second := group.DoChan("key", load)
	<-started
	if calls.Load() != 2 {
		t.Fatal("Forget 后未允许新一轮调用")
	}
	close(release)
	a, b := <-first, <-second
	if a.Val != int32(1) || b.Val != int32(2) || a.Shared || b.Shared {
		t.Fatal("两个独立在途调用的结果错误")
	}
}
