package workerpool

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
)

func TestBoundedWorkersAndOrderedResults(t *testing.T) {
	inputs := make([]int, 40)
	for i := range inputs {
		inputs[i] = i
	}
	started, release := make(chan struct{}, len(inputs)), make(chan struct{})
	var active, peak atomic.Int32
	type outcome struct {
		values []int
		err    error
	}
	result := make(chan outcome, 1)
	go func() {
		values, err := Run(context.Background(), 3, 2, inputs, func(_ context.Context, value int) (int, error) {
			running := active.Add(1)
			defer active.Add(-1)
			for {
				old := peak.Load()
				if old >= running || peak.CompareAndSwap(old, running) {
					break
				}
			}
			started <- struct{}{}
			<-release
			return value * value, nil
		})
		result <- outcome{values, err}
	}()
	for range 3 {
		<-started
	}
	if peak.Load() != 3 {
		t.Error("工作者未达到预期并行度")
	}
	select {
	case <-started:
		t.Error("启动了超额工作者")
	default:
	}
	close(release)
	got := <-result
	if got.err != nil {
		t.Fatal(got.err)
	}
	if len(got.values) != len(inputs) {
		t.Fatalf("结果数=%d", len(got.values))
	}
	for i, value := range got.values {
		if value != i*i {
			t.Fatalf("结果位置 %d 错误", i)
		}
	}
	if peak.Load() > 3 || active.Load() != 0 {
		t.Fatal("并发上限或收尾不符")
	}
}

func TestFailureCancelsAndJoinsOtherWorkers(t *testing.T) {
	ready := make(chan struct{})
	failure := errors.New("处理失败")
	var active atomic.Int32
	values, err := Run(context.Background(), 2, 1, []int{0, 1, 2, 3}, func(ctx context.Context, value int) (int, error) {
		active.Add(1)
		defer active.Add(-1)
		if value == 0 {
			<-ready
			return 0, failure
		}
		if value == 1 {
			close(ready)
			<-ctx.Done()
			return 0, ctx.Err()
		}
		t.Error("取消后不应进入本例的额外任务")
		return value, nil
	})
	if err != failure || values != nil || active.Load() != 0 {
		t.Fatalf("结果=%v，错误=%v，仍活跃=%d", values, err, active.Load())
	}
}

func TestCanceledBeforeStartAndInvalidConfiguration(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	work := func(context.Context, int) (int, error) {
		t.Error("取消发生在调用之前，不应执行处理")
		return 0, nil
	}
	if _, err := Run(ctx, 2, 1, []int{1, 2}, work); !errors.Is(err, context.Canceled) {
		t.Fatalf("取消结果=%v", err)
	}
	if _, err := Run(context.Background(), 0, 1, nil, work); err == nil {
		t.Fatal("零工作者未拒绝")
	}
	if _, err := Run(context.Background(), 1, -1, nil, work); err == nil {
		t.Fatal("负容量未拒绝")
	}
	if _, err := Run(context.Background(), 1, 0, nil, nil); err == nil {
		t.Fatal("空处理函数未拒绝")
	}
}

func TestZeroCapacityAndEmptyInput(t *testing.T) {
	work := func(_ context.Context, value int) (int, error) { return value + 1, nil }
	got, err := Run(context.Background(), 2, 0, []int{1, 2}, work)
	if err != nil || len(got) != 2 || got[0] != 2 || got[1] != 3 {
		t.Fatalf("零容量结果=%v，错误=%v", got, err)
	}
	got, err = Run(context.Background(), 2, 0, nil, work)
	if err != nil || len(got) != 0 {
		t.Fatal("空输入未正常退出")
	}
}
