package quality

import (
	"context"
	"fmt"
	"slices"
	"testing"
	"testing/synctest"
	"time"
)

func TestRoundTrip(t *testing.T) {
	cases := []struct {
		name   string
		values []int
	}{{"普通序列", []int{1, 2, 3}}, {"前导零", []int{0, 1}}, {"最小反例", []int{0}}, {"空序列", []int{}}, {"最大字节", []int{255}}}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			data, err := Encode(tc.values)
			if err != nil {
				t.Fatal(err)
			}
			got, err := Decode(data)
			if err != nil {
				t.Fatal(err)
			}
			if !slices.Equal(got, tc.values) {
				t.Fatalf("往返改变了元素：%v -> %v", tc.values, got)
			}
		})
	}
}
func TestBrokenCounterexample(t *testing.T) {
	input := []int{0}
	data, err := EncodeBroken(input)
	if err != nil {
		t.Fatal(err)
	}
	got, err := Decode(data)
	if err != nil {
		t.Fatal(err)
	}
	if slices.Equal(input, got) {
		t.Fatal("有意缺陷应被反例揭示")
	}
}
func FuzzRoundTrip(f *testing.F) {
	f.Add([]byte{1, 2, 3})
	f.Add([]byte{0, 1})
	f.Add([]byte{0})
	f.Add([]byte{})
	f.Fuzz(func(t *testing.T, input []byte) {
		if len(input) > 64 {
			t.Skip()
		}
		values := make([]int, len(input))
		for i, b := range input {
			values[i] = int(b)
		}
		data, err := Encode(values)
		if err != nil {
			t.Fatal(err)
		}
		got, err := Decode(data)
		if err != nil {
			t.Fatal(err)
		}
		if !slices.Equal(values, got) {
			t.Fatalf("往返不等：%v -> %v", values, got)
		}
	})
}
func TestParallelCleanup(t *testing.T) {
	closed := false
	t.Run("共享资源", func(t *testing.T) {
		t.Cleanup(func() { closed = true })
		for i := range 3 {
			t.Run(fmt.Sprint(i), func(t *testing.T) {
				t.Parallel()
				if closed {
					t.Fatal("子测试结束前资源被关闭")
				}
			})
		}
	})
	if !closed {
		t.Fatal("父级 Cleanup 未执行")
	}
}
func TestContextCleanup(t *testing.T) {
	done := make(chan struct{})
	ctx := t.Context()
	go func() { defer close(done); <-ctx.Done() }()
	t.Cleanup(func() {
		select {
		case <-done:
		case <-time.After(3 * time.Second):
			t.Error("测试取消后任务未退出")
		}
	})
}
func TestVirtualDeadline(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithTimeout(t.Context(), time.Second)
		defer cancel()
		time.Sleep(time.Second - time.Nanosecond)
		synctest.Wait()
		if ctx.Err() != nil {
			t.Fatal("不应提前到期")
		}
		time.Sleep(time.Nanosecond)
		synctest.Wait()
		if ctx.Err() != context.DeadlineExceeded {
			t.Fatal("应到期")
		}
	})
}
