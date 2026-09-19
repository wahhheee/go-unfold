package happensbefore

import (
	"sync"
	"sync/atomic"
	"testing"
)

func TestClosePublishes(t *testing.T) {
	done := make(chan struct{})
	value := 0
	go func() { value = 42; close(done) }()
	<-done
	if value != 42 {
		t.Fatal(value)
	}
}

func TestStartPublishes(t *testing.T) {
	config := []int{42}
	result := make(chan int)
	go func() { result <- config[0] }()
	if got := <-result; got != 42 {
		t.Fatal(got)
	}
}

func TestAtomicOperationsCanLoseUpdate(t *testing.T) {
	var counter atomic.Int64
	ready := make(chan struct{}, 2)
	release := make(chan struct{})
	var wg sync.WaitGroup
	for range 2 {
		wg.Go(func() {
			old := counter.Load()
			ready <- struct{}{}
			<-release
			counter.Store(old + 1)
		})
	}
	<-ready
	<-ready
	close(release)
	wg.Wait()
	if got := counter.Load(); got != 1 {
		t.Fatalf("强制交错应暴露丢失更新，得到 %d", got)
	}
}

func TestAtomicAddPreservesUpdates(t *testing.T) {
	var counter atomic.Int64
	var wg sync.WaitGroup
	for range 100 {
		wg.Go(func() { counter.Add(1) })
	}
	wg.Wait()
	if got := counter.Load(); got != 100 {
		t.Fatal(got)
	}
}
