package vmemory

import (
	"os"
	"path/filepath"
	"syscall"
	"testing"
)

func TestPrivateAndSharedMapping(t *testing.T) {
	path := filepath.Join(t.TempDir(), "page")
	data := make([]byte, os.Getpagesize())
	data[0] = 'A'
	if err := os.WriteFile(path, data, 0600); err != nil {
		t.Fatal(err)
	}
	file, err := os.OpenFile(path, os.O_RDWR, 0)
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()
	mapPage := func(flags int) []byte {
		t.Helper()
		mapped, err := syscall.Mmap(int(file.Fd()), 0, len(data), syscall.PROT_READ|syscall.PROT_WRITE, flags)
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() {
			if err := syscall.Munmap(mapped); err != nil {
				t.Error(err)
			}
		})
		return mapped
	}
	privateA, privateB := mapPage(syscall.MAP_PRIVATE), mapPage(syscall.MAP_PRIVATE)
	if privateA[0] != 'A' || privateB[0] != 'A' {
		t.Fatal("初始文件内容不一致")
	}
	privateA[0] = 'X'
	if privateB[0] != 'A' {
		t.Fatal("私有写入泄漏到了另一映射")
	}
	buf := make([]byte, 1)
	if _, err := file.ReadAt(buf, 0); err != nil {
		t.Fatal(err)
	}
	if buf[0] != 'A' {
		t.Fatal("私有修改不应写回文件")
	}
	sharedA, sharedB := mapPage(syscall.MAP_SHARED), mapPage(syscall.MAP_SHARED)
	sharedA[0] = 'Y'
	if sharedB[0] != 'Y' {
		t.Fatal("共享映射未看到相同页缓存的更新")
	}
	if _, err := file.ReadAt(buf, 0); err != nil {
		t.Fatal(err)
	}
	if buf[0] != 'Y' {
		t.Fatal("文件读取未看到共享修改")
	}
	// 这里只验证可见性；没有 fsync/msync，不能据此断言断电持久性。
}
