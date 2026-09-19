package performance

import (
	"slices"
	"testing"
)

func TestBuilders(t *testing.T) {
	for _, n := range []int{0, 1, 10, 1000} {
		a, b := Build(n), BuildReserved(n)
		if !slices.Equal(a, b) || len(a) != n {
			t.Fatalf("结果不符 n=%d", n)
		}
		for i, v := range a {
			if i != v {
				t.Fatal("元素错误")
			}
		}
	}
}
func BenchmarkBuild(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		_ = Build(1000)
	}
}
func BenchmarkBuildReserved(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		_ = BuildReserved(1000)
	}
}

var outputSink []int

func BenchmarkBuildEscaping(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		outputSink = Build(1000)
	}
}

func BenchmarkBuildReservedEscaping(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		outputSink = BuildReserved(1000)
	}
}
