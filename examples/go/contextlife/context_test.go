package contextlife

import (
	"context"
	"errors"
	"testing"
	"testing/synctest"
	"time"
)

func TestChildCannotExtendParentDeadline(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		parent, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
		defer cancel()
		child, stop := context.WithTimeout(parent, 50*time.Millisecond)
		defer stop()
		parentDeadline, _ := parent.Deadline()
		childDeadline, _ := child.Deadline()
		if !parentDeadline.Equal(childDeadline) {
			t.Fatal("子任务延长了父截止时间")
		}
		time.Sleep(19 * time.Millisecond)
		if child.Err() != nil {
			t.Fatal("提前取消")
		}
		time.Sleep(time.Millisecond)
		<-child.Done()
		if child.Err() != context.DeadlineExceeded {
			t.Fatal("没有继承到期结果")
		}
	})
}

func TestFirstCancellationCauseWins(t *testing.T) {
	parent, cancelParent := context.WithCancelCause(context.Background())
	defer cancelParent(nil)
	first, cancelFirst := context.WithCancelCause(parent)
	defer cancelFirst(nil)
	second, cancelSecond := context.WithCancelCause(parent)
	defer cancelSecond(nil)
	childFailure, parentFailure := errors.New("子任务失败"), errors.New("请求结束")
	cancelFirst(childFailure)
	cancelParent(parentFailure)
	cancelFirst(errors.New("更晚的原因"))
	if first.Err() != context.Canceled || context.Cause(first) != childFailure {
		t.Fatal("子任务首次原因被覆盖")
	}
	if context.Cause(second) != parentFailure || context.Cause(parent) != parentFailure {
		t.Fatal("父原因未传播")
	}
}

func TestWithoutCancelNeedsNewBudget(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		type key struct{}
		parent, cancel := context.WithTimeout(context.WithValue(context.Background(), key{}, "trace-1"), time.Millisecond)
		defer cancel()
		detached := context.WithoutCancel(parent)
		cancel()
		_, hasDeadline := detached.Deadline()
		if detached.Done() != nil || detached.Err() != nil || context.Cause(detached) != nil || hasDeadline {
			t.Fatal("脱离后仍带取消或截止时间")
		}
		if detached.Value(key{}) != "trace-1" {
			t.Fatal("请求值没有保留")
		}
		bounded, stop := context.WithTimeout(detached, 5*time.Millisecond)
		defer stop()
		time.Sleep(5 * time.Millisecond)
		<-bounded.Done()
		if bounded.Err() != context.DeadlineExceeded {
			t.Fatal("新任务没有独立预算")
		}
	})
}

func TestAfterFuncStopDoesNotJoin(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	started, release, finished := make(chan struct{}), make(chan struct{}), make(chan struct{})
	stop := context.AfterFunc(ctx, func() { close(started); <-release; close(finished) })
	cancel()
	<-started
	if stop() {
		t.Error("已开始的回调不应被成功阻止")
	}
	select {
	case <-finished:
		t.Error("回调尚未允许完成")
	default:
	}
	close(release)
	<-finished
}

func TestAfterFuncCanBePreventedBeforeCancellation(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		called := make(chan struct{})
		stop := context.AfterFunc(ctx, func() { close(called) })
		if !stop() || stop() {
			t.Fatal("停止结果不符")
		}
		cancel()
		synctest.Wait()
		select {
		case <-called:
			t.Fatal("已阻止的回调仍然运行")
		default:
		}
	})
}

func TestTimeoutCauseAndExplicitCancelDiffer(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		budget := errors.New("子任务预算耗尽")
		expired, stop := context.WithTimeoutCause(context.Background(), time.Millisecond, budget)
		defer stop()
		time.Sleep(time.Millisecond)
		<-expired.Done()
		if expired.Err() != context.DeadlineExceeded || context.Cause(expired) != budget {
			t.Fatal("到期原因未保留")
		}
		early, cancel := context.WithTimeoutCause(context.Background(), time.Hour, budget)
		cancel()
		if early.Err() != context.Canceled || context.Cause(early) != context.Canceled {
			t.Fatal("提前取消不应使用到期原因")
		}
	})
}

func TestCancellationAndWorkerCompletionAreSeparate(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	observed, finishCleanup, done := make(chan struct{}), make(chan struct{}), make(chan struct{})
	go func() { <-ctx.Done(); close(observed); <-finishCleanup; close(done) }()
	cancel()
	<-observed
	select {
	case <-done:
		t.Error("取消不代表清理已完成")
	default:
	}
	close(finishCleanup)
	<-done
}
