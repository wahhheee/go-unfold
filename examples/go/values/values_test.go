package values

import (
	"fmt"
	"runtime"
	"testing"
	"unsafe"
)

func Example_valueCopy() {
	type Record struct {
		Score int
		Age   *int
	}
	age := 20
	a := Record{Score: 10, Age: &age}
	b := a
	b.Score = 99
	*b.Age = 30
	fmt.Println(a.Score, b.Score, *a.Age, *b.Age)
	// Output: 10 99 30 30
}

func Example_newExpression() {
	p := new(42)
	fmt.Printf("%T %d\n", p, *p)
	// Output: *int 42
}

func Example_loopVariables() {
	var fresh []*int
	for i := 0; i < 3; i++ {
		fresh = append(fresh, &i)
	}
	fmt.Println(*fresh[0], *fresh[1], *fresh[2])
	var reused []*int
	var i int
	for i = 0; i < 3; i++ {
		reused = append(reused, &i)
	}
	fmt.Println(*reused[0], *reused[1], *reused[2])
	// Output:
	// 0 1 2
	// 3 3 3
}

func TestLayoutAMD64(t *testing.T) {
	if runtime.GOARCH != "amd64" {
		t.Skip("本例仅验证 amd64 的当前布局")
	}
	type A struct {
		X byte
		Y int64
		Z byte
	}
	type B struct {
		Y int64
		X byte
		Z byte
	}
	if unsafe.Sizeof(A{}) != 24 || unsafe.Sizeof(B{}) != 16 {
		t.Fatal("示例的布局前提已改变，请重新核验正文")
	}
}
