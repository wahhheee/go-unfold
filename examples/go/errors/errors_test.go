package errors_test

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"testing"
	"time"
)

type FieldError struct{ Field string }

func (e *FieldError) Error() string { return "invalid field: " + e.Field }
func Example_errorTree() {
	base := errors.New("missing")
	err := fmt.Errorf("load user: %w", base)
	fmt.Println(err == base, errors.Is(err, base))
	typed := fmt.Errorf("create: %w", &FieldError{Field: "email"})
	field, ok := errors.AsType[*FieldError](typed)
	fmt.Println(field.Field, ok)
	other := errors.New("close")
	joined := errors.Join(err, other)
	fmt.Println(errors.Is(joined, base), errors.Is(joined, other), errors.Unwrap(joined) == nil)
	// Output:
	// false true
	// email true
	// true true true
}
func Observe() {
	x := 1
	defer fmt.Println("arg", x)
	defer func() { fmt.Println("closure", x) }()
	x = 2
}
func Result() (n int) { defer func() { n++ }(); return 5 }
func Example_defer() {
	Observe()
	fmt.Println(Result())
	// Output:
	// closure 2
	// arg 1
	// 6
}
func Drain(r io.ReadCloser) (err error) {
	defer func() { err = errors.Join(err, r.Close()) }()
	_, err = io.Copy(io.Discard, r)
	return err
}

type brokenReader struct {
	readErr, closeErr error
	closed            bool
}

func (r *brokenReader) Read([]byte) (int, error) { return 0, r.readErr }
func (r *brokenReader) Close() error             { r.closed = true; return r.closeErr }
func TestCleanupKeepsBothErrors(t *testing.T) {
	a, b := errors.New("read"), errors.New("close")
	r := &brokenReader{readErr: a, closeErr: b}
	err := Drain(r)
	if !r.closed || !errors.Is(err, a) || !errors.Is(err, b) {
		t.Fatal("读取和关闭失败都应保留")
	}
	if errors.Join(nil, nil) != nil {
		t.Fatal("全 nil 应返回 nil")
	}
}
func TestPanicNil(t *testing.T) {
	t.Setenv("GODEBUG", "panicnil=0")
	defer func() {
		if _, ok := recover().(*runtime.PanicNilError); !ok {
			t.Fatal("现代语义应恢复到 PanicNilError")
		}
	}()
	panic(nil)
}
func indirectRecover() any { return recover() }
func TestRecoverMustBeDirect(t *testing.T) {
	var nested any
	func() {
		defer func() {
			if recover() != "boom" {
				t.Error("外层直接恢复应捕获 panic")
			}
		}()
		defer func() { nested = indirectRecover() }()
		panic("boom")
	}()
	if nested != nil {
		t.Fatal("间接调用不应恢复")
	}
}
func TestRecoverBoundary(t *testing.T) {
	if os.Getenv("GO_LEARNING_PANIC_CHILD") == "1" {
		defer func() { _ = recover() }()
		go func() { panic("child boom") }()
		select {}
	}
	executable, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, executable, "-test.run=^TestRecoverBoundary$")
	cmd.Env = append(os.Environ(), "GO_LEARNING_PANIC_CHILD=1")
	output, err := cmd.CombinedOutput()
	if err == nil || !strings.Contains(string(output), "panic: child boom") {
		t.Fatalf("子进程应因未恢复的子 goroutine panic 失败：%v %s", err, output)
	}
}
