package descriptors

import (
	"context"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"testing"
	"time"
)

func readTwo(t *testing.T, f *os.File, want string) {
	t.Helper()
	b := make([]byte, 2)
	if _, err := io.ReadFull(f, b); err != nil || string(b) != want {
		t.Fatalf("读到 %q，期望 %q：%v", b, want, err)
	}
}
func TestDupAndOpen(t *testing.T) {
	path := filepath.Join(t.TempDir(), "letters")
	if err := os.WriteFile(path, []byte("ABCDEFGH"), 0600); err != nil {
		t.Fatal(err)
	}
	f, err := os.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	readTwo(t, f, "AB")
	number, err := syscall.Dup(int(f.Fd()))
	if err != nil {
		t.Fatal(err)
	}
	duplicate := os.NewFile(uintptr(number), "duplicate")
	defer duplicate.Close()
	readTwo(t, duplicate, "CD")
	independent, err := os.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer independent.Close()
	readTwo(t, independent, "AB")
	if err = f.Close(); err != nil {
		t.Fatal(err)
	}
	readTwo(t, duplicate, "EF")
}
func TestInheritedDescriptor(t *testing.T) {
	if os.Getenv("GO_LESSON_FD_CHILD") == "1" {
		f := os.NewFile(3, "inherited")
		defer f.Close()
		readTwo(t, f, "CD")
		return
	}
	path := filepath.Join(t.TempDir(), "letters")
	if err := os.WriteFile(path, []byte("ABCDEFGH"), 0600); err != nil {
		t.Fatal(err)
	}
	f, err := os.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	readTwo(t, f, "AB")
	exe, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, exe, "-test.run=^TestInheritedDescriptor$")
	cmd.Env = append(os.Environ(), "GO_LESSON_FD_CHILD=1")
	cmd.ExtraFiles = []*os.File{f}
	out, err := cmd.CombinedOutput()
	if err != nil || !strings.Contains(string(out), "PASS") {
		t.Fatalf("固定子进程失败：%s %v", out, err)
	}
	readTwo(t, f, "EF")
}
