package memory

import (
	"bytes"
	"fmt"
	"runtime/metrics"
	"testing"
)

func Example_lifetime() {
	fmt.Println(Local())
	Save()
	fmt.Println(*Saved)
	// Output:
	// 7
	// 7
}
func TestPoolOutputOwnership(t *testing.T) {
	first := Encode("first")
	for range 100 {
		_ = Encode("other")
	}
	if !bytes.Equal(first, []byte("first")) {
		t.Fatal("返回值不应被后续缓冲区复用覆盖")
	}
}
func TestMemoryMetricKinds(t *testing.T) {
	samples := []metrics.Sample{{Name: "/gc/heap/live:bytes"}, {Name: "/gc/heap/goal:bytes"}, {Name: "/memory/classes/total:bytes"}, {Name: "/memory/classes/heap/released:bytes"}}
	metrics.Read(samples)
	for _, sample := range samples {
		if sample.Value.Kind() != metrics.KindUint64 {
			t.Fatalf("指标不可用：%s", sample.Name)
		}
	}
}
