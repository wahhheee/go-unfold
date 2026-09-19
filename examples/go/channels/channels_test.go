package channels

import (
	"bytes"
	"slices"
	"sync"
	"testing"
	"testing/synctest"
)

func TestCloseDrains(t *testing.T) {
	ch := make(chan int, 1)
	ch <- 0
	close(ch)
	if v, ok := <-ch; v != 0 || !ok {
		t.Fatalf("第一项：%d %v", v, ok)
	}
	if v, ok := <-ch; v != 0 || ok {
		t.Fatalf("结束：%d %v", v, ok)
	}
}
func TestNilNeverReady(t *testing.T) {
	var ch chan int
	select {
	case ch <- 1:
		t.Fatal("nil 不应可发送")
	case <-ch:
		t.Fatal("nil 不应可接收")
	default:
	}
}
func TestInvalidCloseAndSend(t *testing.T) {
	for name, run := range map[string]func(){
		"关闭nil": func() { var ch chan int; close(ch) },
		"重复关闭":  func() { ch := make(chan int); close(ch); close(ch) },
		"关闭后发送": func() { ch := make(chan int); close(ch); ch <- 1 },
	} {
		t.Run(name, func(t *testing.T) {
			defer func() {
				if recover() == nil {
					t.Error("应触发 panic")
				}
			}()
			run()
		})
	}
}
func TestUnbufferedHandoff(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ch := make(chan int)
		finished := false
		go func() { ch <- 7; finished = true }()
		synctest.Wait()
		if finished {
			t.Fatal("接收之前发送不应完成")
		}
		if got := <-ch; got != 7 {
			t.Fatal(got)
		}
		synctest.Wait()
		if !finished {
			t.Fatal("交接后发送应能完成")
		}
	})
}
func TestSliceOwnership(t *testing.T) {
	ch := make(chan []byte, 1)
	buf := []byte("abc")
	ch <- buf
	buf[0] = 'X'
	if got := string(<-ch); got != "Xbc" {
		t.Fatal(got)
	}
	ch <- bytes.Clone(buf)
	buf[0] = 'Y'
	if got := string(<-ch); got != "Xbc" {
		t.Fatal(got)
	}
}
func TestCoordinatorCloses(t *testing.T) {
	out := make(chan int)
	var senders sync.WaitGroup
	for i := range 3 {
		senders.Go(func() { out <- i })
	}
	go func() { senders.Wait(); close(out) }()
	var got []int
	for value := range out {
		got = append(got, value)
	}
	slices.Sort(got)
	if !slices.Equal(got, []int{0, 1, 2}) {
		t.Fatal(got)
	}
}
