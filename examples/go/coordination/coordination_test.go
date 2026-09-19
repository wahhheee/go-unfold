package coordination

import (
	"errors"
	"slices"
	"sync"
	"testing"
	"testing/synctest"
)

func TestWaitGroupPublishesCompletedTasks(t *testing.T) {
	var wg sync.WaitGroup
	results := make([]int, 20)
	for i := range results {
		wg.Go(func() { results[i] = i + 1 })
	}
	wg.Wait()
	for i, got := range results {
		if got != i+1 {
			t.Fatalf("任务 %d 未完成", i)
		}
	}
}

func TestEmptyWaitDoesNotCoverFutureRegistration(t *testing.T) {
	var wg sync.WaitGroup
	completed := false
	start, registered := make(chan struct{}), make(chan struct{})
	go func() {
		<-start
		wg.Go(func() { completed = true })
		close(registered)
	}()
	wg.Wait()
	if completed {
		t.Fatal("尚未运行的任务不应完成")
	}
	// 前一轮 Wait 已经返回后才注册，展示空计数不会等待未来任务。
	close(start)
	<-registered
	wg.Wait()
	if !completed {
		t.Fatal("已注册任务未完成")
	}
}

func recovered(f func()) (value any) {
	defer func() { value = recover() }()
	f()
	return nil
}

func TestOnceDoPanicIsNotRetried(t *testing.T) {
	var once sync.Once
	calls := 0
	first := recovered(func() { once.Do(func() { calls++; panic("初始化失败") }) })
	second := recovered(func() { once.Do(func() { calls++ }) })
	if first != "初始化失败" || second != nil || calls != 1 {
		t.Fatal("Once.Do 的 panic 后行为不符")
	}
}

func TestOnceValueReplaysPanicAndOnceValuesCachesError(t *testing.T) {
	calls := 0
	get := sync.OnceValue(func() int { calls++; panic("初始化失败") })
	for range 2 {
		if recovered(func() { get() }) != "初始化失败" {
			t.Fatal("未重放同一个 panic")
		}
	}
	if calls != 1 {
		t.Fatal("初始化被重试")
	}
	transient := errors.New("本次连接失败")
	attempts := 0
	connect := sync.OnceValues(func() (int, error) { attempts++; return 0, transient })
	for range 2 {
		value, err := connect()
		if value != 0 || err != transient {
			t.Fatal("返回值未缓存")
		}
	}
	if attempts != 1 {
		t.Fatal("错误结果被自动重试")
	}
}

func TestCondBroadcastRequiresPredicateLoop(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		var mu sync.Mutex
		cond := sync.NewCond(&mu)
		var queue, consumed []int
		closed, waits := false, 0
		var wg sync.WaitGroup
		for range 2 {
			wg.Go(func() {
				mu.Lock()
				defer mu.Unlock()
				for {
					for len(queue) == 0 && !closed {
						waits++
						cond.Wait()
					}
					if len(queue) == 0 {
						return
					}
					consumed = append(consumed, queue[0])
					queue = queue[1:]
				}
			})
		}
		synctest.Wait()
		mu.Lock()
		if waits != 2 {
			t.Errorf("初始等待数=%d", waits)
		}
		queue = append(queue, 7)
		cond.Broadcast()
		mu.Unlock()
		synctest.Wait()
		mu.Lock()
		if !slices.Equal(consumed, []int{7}) || waits != 4 {
			t.Errorf("消费=%v，等待次数=%d", consumed, waits)
		}
		closed = true
		cond.Broadcast()
		mu.Unlock()
		wg.Wait()
	})
}

func TestCondSignalIsNotStoredPermit(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		var mu sync.Mutex
		cond := sync.NewCond(&mu)
		cond.Signal()
		returned := false
		go func() {
			mu.Lock()
			cond.Wait()
			returned = true
			mu.Unlock()
		}()
		synctest.Wait()
		mu.Lock()
		if returned {
			t.Error("较早的 Signal 不应留下许可")
		}
		cond.Signal()
		mu.Unlock()
		synctest.Wait()
		mu.Lock()
		if !returned {
			t.Error("等待者未被唤醒")
		}
		mu.Unlock()
	})
}
