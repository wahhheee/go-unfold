package atomics

import (
	"maps"
	"sync"
	"sync/atomic"
	"testing"
)

func reserve(remaining *atomic.Int64, n int64) bool {
	if n <= 0 {
		return false
	}
	for {
		old := remaining.Load()
		if old < n {
			return false
		}
		if remaining.CompareAndSwap(old, old-n) {
			return true
		}
	}
}

func TestCASReservation(t *testing.T) {
	var remaining atomic.Int64
	var accepted atomic.Int64
	remaining.Store(41)
	var wg sync.WaitGroup
	for range 200 {
		wg.Go(func() {
			if reserve(&remaining, 1) {
				accepted.Add(1)
			}
		})
	}
	wg.Wait()
	if remaining.Load() != 0 || accepted.Load() != 41 {
		t.Fatal("CAS 扣减破坏库存不变量")
	}
	if reserve(&remaining, -1) || reserve(&remaining, 0) {
		t.Fatal("接受了无效扣减")
	}
}

type config struct {
	version int
	quotas  map[string]int
}

func TestImmutableSnapshotPublishesWholeVersion(t *testing.T) {
	var current atomic.Pointer[config]
	if current.Load() != nil {
		t.Fatal("零值不是 nil")
	}
	first := &config{version: 1, quotas: map[string]int{"a": 10, "b": 90}}
	current.Store(first)
	var writer sync.Mutex
	var wg sync.WaitGroup
	for range 2 {
		wg.Go(func() {
			for i := range 500 {
				writer.Lock()
				old := current.Load()
				next := &config{version: old.version + 1, quotas: maps.Clone(old.quotas)}
				next.quotas["a"], next.quotas["b"] = i%101, 100-i%101
				current.Store(next)
				writer.Unlock()
			}
		})
	}
	for range 4 {
		wg.Go(func() {
			for range 2000 {
				snapshot := current.Load()
				if snapshot.quotas["a"]+snapshot.quotas["b"] != 100 {
					t.Error("一次读取混入不同版本")
					return
				}
			}
		})
	}
	wg.Wait()
	if first.quotas["a"] != 10 || first.version != 1 {
		t.Fatal("旧快照被修改")
	}
	if current.Load().version != 1001 {
		t.Fatal("并发写者丢失更新")
	}
}

func TestShallowCopyRetainsMapAlias(t *testing.T) {
	old := &config{version: 1, quotas: map[string]int{"a": 10}}
	next := *old
	next.version = 2
	next.quotas["a"] = 20
	if old.quotas["a"] != 20 {
		t.Fatal("未复现浅复制别名")
	}
	// 顺序访问足以证明共享；这里不靠真的制造并发 map 读写来演示。
	next.quotas = maps.Clone(old.quotas)
	next.quotas["a"] = 30
	if old.quotas["a"] != 20 {
		t.Fatal("独立 map 修改污染旧对象")
	}
}

func TestValueTypeAndNilContracts(t *testing.T) {
	var value atomic.Value
	if value.Load() != nil {
		t.Fatal("未初始化 Value 应返回 nil")
	}
	value.Store(map[string]int{"a": 1})
	for _, tc := range []struct {
		name   string
		action func()
	}{
		{"存入 nil", func() { value.Store(nil) }},
		{"更换具体类型", func() { value.Store(1) }},
		{"CAS 比较不可比较的 map", func() { value.CompareAndSwap(map[string]int{"a": 1}, map[string]int{"a": 2}) }},
	} {
		t.Run(tc.name, func(t *testing.T) {
			defer func() {
				if recover() == nil {
					t.Error("应当 panic")
				}
			}()
			tc.action()
		})
	}
	var typed atomic.Value
	typed.Store((*config)(nil))
	if typed.Load() == nil || typed.Load().(*config) != nil {
		t.Fatal("typed nil 与 nil 接口未区分")
	}
}

func TestCASDoesNotDetectHistory(t *testing.T) {
	a, b, c := new(config), new(config), new(config)
	var current atomic.Pointer[config]
	current.Store(a)
	observed := current.Load()
	current.Store(b)
	current.Store(a)
	if !current.CompareAndSwap(observed, c) {
		t.Fatal("A-B-A 后当前指针仍与旧观测相等")
	}
}
