package interfaces

import (
	"fmt"
	"testing"
)

type Fault struct{ Message string }

func (f *Fault) Error() string {
	if f == nil {
		return "nil fault"
	}
	return f.Message
}

func Example_typedNil() {
	var p *Fault
	var err error = p
	fmt.Println(p == nil, err == nil)
	fmt.Println(err.Error())
	value, ok := err.(*Fault)
	fmt.Println(ok, value == nil)
	// Output:
	// true false
	// nil fault
	// true true
}

type Counter int

func (c *Counter) Increment() { *c++ }

type Incrementer interface{ Increment() }

var _ Incrementer = (*Counter)(nil)

func Example_methodSet() {
	var c Counter
	c.Increment()
	var counter Incrementer = &c
	counter.Increment()
	fmt.Println(c)
	// Output: 2
}

func TestInterfaceComparison(t *testing.T) {
	var empty any
	var pointer any = (*Fault)(nil)
	var integer any = 0
	var slice any = []int(nil)
	if empty != nil || pointer == nil || integer == nil || slice == nil {
		t.Fatal("接口 nil 判断不符合预期")
	}
	if empty != empty || pointer != pointer || integer != integer {
		t.Fatal("可比较值自比较应相等")
	}
	if slice == integer {
		t.Fatal("不同动态类型的接口不应相等")
	}
	defer func() {
		if recover() == nil {
			t.Fatal("相同不可比较动态类型应触发 panic")
		}
	}()
	_ = slice == slice
}
