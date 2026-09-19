package maps

import (
	"fmt"
	"maps"
	"math"
	"slices"
	"sync"
	"testing"
)

func Example_keys() {
	var empty map[string]int
	v, ok := empty["x"]
	delete(empty, "x")
	clear(empty)
	fmt.Println(v, ok, len(empty))
	x := math.NaN()
	m := map[float64]int{x: 1}
	_, ok = m[x]
	delete(m, x)
	fmt.Println(ok, len(m))
	clear(m)
	fmt.Println(len(m))
	counts := map[string]int{"b": 2, "a": 1}
	fmt.Println(slices.Sorted(maps.Keys(counts)))
	// Output:
	// 0 false 0
	// false 1
	// 0
	// [a b]
}
func TestNilWrite(t *testing.T) {
	defer func() {
		if recover() == nil {
			t.Fatal("nil map 写入应 panic")
		}
	}()
	var m map[string]int
	m["x"] = 1
}
func TestDeleteUnvisited(t *testing.T) {
	m := map[int]int{1: 1, 2: 2, 3: 3}
	seen := 0
	for k := range m {
		seen++
		for other := range m {
			if other != k {
				delete(m, other)
			}
		}
	}
	if seen != 1 {
		t.Fatal("删除的未访问条目不应被产生")
	}
}
func TestCloneIsShallow(t *testing.T) {
	v := 1
	a := map[string]*int{"x": &v}
	b := maps.Clone(a)
	*b["x"] = 2
	delete(b, "x")
	if len(a) != 1 || *a["x"] != 2 {
		t.Fatal("结构独立，但对象应共享")
	}
}

type Counter struct {
	mu sync.Mutex
	m  map[string]int
}

func (c *Counter) Add(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.m == nil {
		c.m = make(map[string]int)
	}
	c.m[key]++
}
func TestLockedCounter(t *testing.T) {
	var c Counter
	var wg sync.WaitGroup
	for range 10 {
		wg.Go(func() {
			for range 100 {
				c.Add("ok")
			}
		})
	}
	wg.Wait()
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.m["ok"] != 1000 {
		t.Fatal(c.m)
	}
}
