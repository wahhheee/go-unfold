package generics

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"go/types"
	"testing"
)

func Unique[T comparable](in []T) []T {
	seen := make(map[T]struct{}, len(in))
	out := make([]T, 0, len(in))
	for _, v := range in {
		if _, ok := seen[v]; !ok {
			seen[v] = struct{}{}
			out = append(out, v)
		}
	}
	return out
}
func Equal[T comparable](a, b T) bool { return a == b }

type Box[T any] struct{ Value T }

func (b Box[T]) Get() T                   { return b.Value }
func (b Box[T]) Map[U any](f func(T) U) U { return f(b.Value) }

type Set[K comparable] = map[K]struct{}

func Copy[S ~[]E, E any](in S) S {
	if in == nil {
		return nil
	}
	out := make(S, len(in))
	copy(out, in)
	return out
}
func Example_generics() {
	fmt.Println(Unique([]int{3, 1, 3}))
	fmt.Println(Box[string]{Value: "go"}.Map(func(s string) int { return len(s) }))
	type IDs []int
	copied := Copy(IDs{1, 2})
	fmt.Printf("%T %v\n", copied, copied)
	fmt.Println(Equal[any](1, 1))
	// Output:
	// [3 1]
	// 2
	// generics.IDs [1 2]
	// true
}
func checkCode(source, version string) error {
	fset := token.NewFileSet()
	f, err := parser.ParseFile(fset, "case.go", source, 0)
	if err != nil {
		return err
	}
	conf := types.Config{GoVersion: version}
	_, err = conf.Check("example", fset, []*ast.File{f}, nil)
	return err
}
func TestConstraintMatrix(t *testing.T) {
	names := []string{"int", "UserID", "string", "[]int", "any", "struct{V any}", "*int"}
	cases := []struct {
		constraint string
		want       []bool
	}{
		{"int", []bool{true, false, false, false, false, false, false}},
		{"~int", []bool{true, true, false, false, false, false, false}},
		{"~int|~string", []bool{true, true, true, false, false, false, false}},
		{"comparable", []bool{true, true, true, false, true, true, true}},
	}
	for _, c := range cases {
		for i, name := range names {
			t.Run(c.constraint+"/"+name, func(t *testing.T) {
				src := fmt.Sprintf("package p; type UserID int; func F[T %s]() {}; var _ = F[%s]", c.constraint, name)
				if err := checkCode(src, "go1.27"); (err == nil) != c.want[i] {
					t.Fatalf("类型关系不符：%v", err)
				}
			})
		}
	}
}
func TestConstraintFailures(t *testing.T) {
	cases := []string{
		"type C interface{~int}; var x C",
		"type ID int; type C interface{~ID}",
		"type ID int; type C interface{~int|ID}",
		"type I interface { M[T any](T) }",
		"type B struct{}; func(B) M[T any](v T) T{return v}; var _ interface{M(int)int}=B{}",
		"func F[T any](v T){ _=v.(int) }",
	}
	for _, src := range cases {
		if checkCode("package p; "+src, "go1.27") == nil {
			t.Fatalf("应拒绝：%s", src)
		}
	}
	src := "package p; type B struct{}; func(B) M[T any](v T) T{return v}"
	if checkCode(src, "go1.26") == nil {
		t.Fatal("旧语言版本不应支持泛型方法")
	}
	if err := checkCode(src, "go1.27"); err != nil {
		t.Fatal(err)
	}
}
func TestComparablePanic(t *testing.T) {
	defer func() {
		if recover() == nil {
			t.Fatal("接口内切片比较应 panic")
		}
	}()
	_ = Equal[any]([]int{1}, []int{1})
}
