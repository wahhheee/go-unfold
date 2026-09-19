package locking

import (
	"sync"
	"sync/atomic"
	"testing"
)

type stock struct {
	mu        sync.Mutex
	remaining int
}

func (s *stock) reserve(n int) bool {
	if n <= 0 {
		return false
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.remaining < n {
		return false
	}
	s.remaining -= n
	return true
}

func TestSplitCriticalSectionsOversellWithoutDataRace(t *testing.T) {
	s := stock{remaining: 1}
	checked := make(chan struct{}, 2)
	deduct := make(chan struct{})
	var wg sync.WaitGroup
	for range 2 {
		wg.Go(func() {
			s.mu.Lock()
			enough := s.remaining >= 1
			s.mu.Unlock()
			checked <- struct{}{}
			<-deduct
			if enough {
				s.mu.Lock()
				s.remaining--
				s.mu.Unlock()
			}
		})
	}
	// 两次检查都完成后才允许扣减，稳定展示业务竞争而不制造数据竞争。
	<-checked
	<-checked
	close(deduct)
	wg.Wait()
	if s.remaining != -1 {
		t.Fatalf("分段临界区未复现超卖：%d", s.remaining)
	}
}

func TestReservePreservesInvariant(t *testing.T) {
	s := stock{remaining: 37}
	var accepted atomic.Int32
	var wg sync.WaitGroup
	for range 200 {
		wg.Go(func() {
			if s.reserve(1) {
				accepted.Add(1)
			}
		})
	}
	wg.Wait()
	if s.remaining != 0 || accepted.Load() != 37 {
		t.Fatalf("库存=%d，成功=%d", s.remaining, accepted.Load())
	}
	if s.reserve(0) || s.reserve(-1) || s.remaining != 0 {
		t.Fatal("无效扣减改变了库存")
	}
}

func TestRWMutexPermissions(t *testing.T) {
	var rw sync.RWMutex
	rw.RLock()
	if rw.TryLock() {
		t.Fatal("已有读者时获得了写锁")
	}
	if !rw.TryRLock() {
		t.Fatal("没有等待写者时无法获得另一个读锁")
	}
	rw.RUnlock()
	rw.RUnlock()
	rw.Lock()
	if rw.TryRLock() || rw.TryLock() {
		t.Fatal("写锁未排斥其他获取")
	}
	rw.Unlock()
}

func TestMutexMayBeUnlockedByAnotherGoroutine(t *testing.T) {
	var mu sync.Mutex
	mu.Lock()
	done := make(chan struct{})
	go func() { mu.Unlock(); close(done) }()
	<-done
	if !mu.TryLock() {
		t.Fatal("另一个 G 没有释放锁")
	}
	mu.Unlock()
}
