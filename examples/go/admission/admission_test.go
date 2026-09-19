package admission

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
	"testing/synctest"
	"time"

	"golang.org/x/sync/semaphore"
	"golang.org/x/time/rate"
)

func TestTokenBucketMatchesTeachingVectors(t *testing.T) {
	limiter := rate.NewLimiter(2, 3)
	start := time.Unix(100, 0)
	cases := []struct {
		ms      int
		n       int
		allowed bool
		tokens  float64
	}{
		{0, 3, true, 0}, {0, 1, false, 0}, {250, 1, false, 0.5},
		{500, 1, true, 0}, {10000, 4, false, 3}, {10000, 3, true, 0},
	}
	for _, tc := range cases {
		now := start.Add(time.Duration(tc.ms) * time.Millisecond)
		if got := limiter.AllowN(now, tc.n); got != tc.allowed {
			t.Fatalf("%+v: 允许=%v", tc, got)
		}
		if got := limiter.TokensAt(now); got != tc.tokens {
			t.Fatalf("%+v: 令牌=%v", tc, got)
		}
	}
}

func TestReservationsAndCancellationAreNotUnlimitedRefunds(t *testing.T) {
	now := time.Unix(100, 0)
	limiter := rate.NewLimiter(1, 1)
	if !limiter.AllowN(now, 1) {
		t.Fatal("初始桶非满")
	}
	first := limiter.ReserveN(now, 1)
	second := limiter.ReserveN(now, 1)
	if first.DelayFrom(now) != time.Second || second.DelayFrom(now) != 2*time.Second {
		t.Fatal("预约未计入后续等待")
	}
	first.CancelAt(now)
	if limiter.TokensAt(now) != -2 {
		t.Fatal("后续预约存在时，早期预约不能无条件退回全部额度")
	}
	second.CancelAt(now)
	if limiter.TokensAt(now) != -1 {
		t.Fatal("最后预约的可恢复额度不符")
	}
}

func TestWaitDeadlineAndVirtualTime(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		limiter := rate.NewLimiter(2, 1)
		if !limiter.Allow() {
			t.Fatal("初始令牌丢失")
		}
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
		defer cancel()
		if err := limiter.Wait(ctx); err == nil || ctx.Err() != nil {
			t.Fatal("预计等待超出截止时间应提前拒绝，此时 Context 尚未到期")
		}
		before := time.Now()
		if err := limiter.Wait(context.Background()); err != nil {
			t.Fatal(err)
		}
		if time.Since(before) != 500*time.Millisecond {
			t.Fatal("等待没有按速率补充")
		}
		waiting, stop := context.WithCancel(context.Background())
		result := make(chan error, 1)
		go func() { result <- limiter.Wait(waiting) }()
		synctest.Wait()
		stop()
		if err := <-result; !errors.Is(err, context.Canceled) {
			t.Fatalf("取消=%v", err)
		}
	})
}

func TestWeightedAdmissionBoundsActiveCostAndJoins(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		weights := []int64{2, 2, 1, 3, 1, 2}
		var active, completed atomic.Int64
		err := RunWeighted(context.Background(), 3, weights, func(_ context.Context, index int) error {
			if got := active.Add(weights[index]); got > 3 {
				t.Errorf("活跃权重=%d", got)
			}
			defer active.Add(-weights[index])
			time.Sleep(time.Second)
			completed.Add(1)
			return nil
		})
		if err != nil || active.Load() != 0 || completed.Load() != int64(len(weights)) {
			t.Fatalf("收尾失败：%v", err)
		}
	})
	if err := RunWeighted(context.Background(), 3, []int64{4}, func(context.Context, int) error { t.Error("无效权重不应执行"); return nil }); err == nil {
		t.Fatal("超额权重未提前拒绝")
	}
}

func TestWeightedHeadOfLineAndCanceledAcquire(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		sem := semaphore.NewWeighted(3)
		if err := sem.Acquire(context.Background(), 2); err != nil {
			t.Fatal(err)
		}
		result := make(chan error, 1)
		go func() {
			err := sem.Acquire(context.Background(), 3)
			if err == nil {
				sem.Release(3)
			}
			result <- err
		}()
		synctest.Wait()
		if sem.TryAcquire(1) {
			sem.Release(1)
			t.Error("小任务绕过了正在等待的大任务")
		}
		sem.Release(2)
		if err := <-result; err != nil {
			t.Fatal(err)
		}
		ctx, cancel := context.WithCancel(context.Background())
		cancel()
		if err := sem.Acquire(ctx, 1); !errors.Is(err, context.Canceled) {
			t.Fatal("预先取消未生效")
		}
		if !sem.TryAcquire(3) {
			t.Fatal("失败的 Acquire 占用了额度")
		}
		sem.Release(3)
	})
}

func TestOversizedAcquireWaitsForCancellation(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		sem := semaphore.NewWeighted(2)
		ctx, cancel := context.WithCancel(context.Background())
		result := make(chan error, 1)
		go func() { result <- sem.Acquire(ctx, 3) }()
		synctest.Wait()
		select {
		case <-result:
			t.Error("超额申请不应被当成自动快速报错")
		default:
		}
		cancel()
		if err := <-result; !errors.Is(err, context.Canceled) {
			t.Fatal(err)
		}
	})
}
