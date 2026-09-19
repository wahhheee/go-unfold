package selection

import (
	"testing"
	"testing/synctest"
	"time"
)

func TestSelectEvaluatesSendBeforeChoosing(t *testing.T) {
	var ch chan int
	calls := 0
	select {
	case ch <- func() int { calls++; return 7 }():
		t.Fatal("nil 发送不应被选中")
	default:
	}
	if calls != 1 {
		t.Fatal("未选中的发送表达式也应求值")
	}
	indexCalls := 0
	a := []int{0}
	select {
	case a[func() int { indexCalls++; return 0 }()] = <-ch:
		t.Fatal("nil 接收不应被选中")
	default:
	}
	if indexCalls != 0 {
		t.Fatal("未选中接收的赋值左侧不应求值")
	}
}
func TestClosedCases(t *testing.T) {
	ch := make(chan int)
	close(ch)
	select {
	case _, ok := <-ch:
		if ok {
			t.Fatal("关闭接收应为 false")
		}
	default:
		t.Fatal("关闭接收始终就绪")
	}
	defer func() {
		if recover() == nil {
			t.Error("选中关闭发送应 panic")
		}
	}()
	select {
	case ch <- 1:
	default:
		t.Fatal("default 不会屏蔽关闭发送")
	}
}
func TestResetDoesNotDeliverOldDeadline(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		timer := time.NewTimer(time.Second)
		defer timer.Stop()
		time.Sleep(2 * time.Second)
		timer.Reset(3 * time.Second)
		select {
		case <-timer.C:
			t.Fatal("不应收到旧到期值")
		default:
		}
		time.Sleep(3 * time.Second)
		select {
		case <-timer.C:
		default:
			t.Fatal("新到期值应已就绪")
		}
	})
}
func TestGo127RemovedLegacyTimerMode(t *testing.T) {
	t.Setenv("GODEBUG", "asynctimerchan=1")
	timer := time.NewTimer(time.Hour)
	defer timer.Stop()
	if cap(timer.C) != 0 {
		t.Fatal("Go 1.27 的 timer channel 应始终无缓冲")
	}
}
func TestTickerStopDoesNotClose(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ticker := time.NewTicker(time.Second)
		ticker.Stop()
		time.Sleep(2 * time.Second)
		select {
		case <-ticker.C:
			t.Fatal("Stop 不关闭 channel，也不继续投递")
		default:
		}
	})
}
