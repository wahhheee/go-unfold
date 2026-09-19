package sequences

import (
	"encoding/json"
	"fmt"
	"slices"
	"testing"
	"unicode/utf8"
)

func TestAppendModes(t *testing.T) {
	for _, mode := range []string{"share", "limit", "copy"} {
		for n := 1; n <= 4; n++ {
			t.Run(fmt.Sprintf("%s/%d", mode, n), func(t *testing.T) {
				base := []int{10, 20, 30, 40}
				a := base[:n]
				b := a
				if mode == "limit" {
					b = a[:len(a):len(a)]
				}
				if mode == "copy" {
					b = make([]int, len(a))
					copy(b, a)
				}
				b = append(b, 99)
				b[0] = 7
				want := []int{10, 20, 30, 40}
				if mode == "share" && n < 4 {
					want[0] = 7
					want[n] = 99
				}
				if !slices.Equal(base, want) || len(a) != n || len(b) != n+1 {
					t.Fatalf("共享结果错误：%v %v %v", base, a, b)
				}
			})
		}
	}
}
func Example_values() {
	a := [3]int{1, 2, 3}
	b := a
	b[0] = 9
	fmt.Println(a, b)
	s := a[:2]
	u := s
	u[0] = 8
	fmt.Println(a, s)
	x := []int{1, 2, 3, 4}
	copy(x[1:], x[:3])
	fmt.Println(x)
	var empty []int
	p, _ := json.Marshal(empty)
	q, _ := json.Marshal([]int{})
	fmt.Println(string(p), string(q))
	// Output:
	// [1 2 3] [9 2 3]
	// [8 2 3] [8 2]
	// [1 1 2 3]
	// null []
}
func TestClipCloneDelete(t *testing.T) {
	base := []int{1, 2, 3}
	clipped := slices.Clip(base[:1])
	clipped[0] = 9
	if base[0] != 9 || cap(clipped) != 1 {
		t.Fatal("Clip 应共享已有数组")
	}
	cloned := slices.Clone(base[:1])
	cloned[0] = 8
	if base[0] != 9 {
		t.Fatal("Clone 应复制元素")
	}
	a, b, c := 1, 2, 3
	ptrs := []*int{&a, &b, &c}
	alias := ptrs
	ptrs = slices.Delete(ptrs, 1, 2)
	if len(ptrs) != 2 || ptrs[1] != &c || alias[2] != nil {
		t.Fatal("删除应移动元素并清零尾部")
	}
}
func Example_text() {
	s := "Go中"
	fmt.Println(len(s), utf8.RuneCountInString(s))
	for i, r := range s {
		if i > 0 {
			fmt.Print(" ")
		}
		fmt.Printf("%d:%U", i, r)
	}
	fmt.Println()
	bad := string([]byte{0xff, 'A'})
	fmt.Println(utf8.ValidString(bad))
	for i, r := range bad {
		if i > 0 {
			fmt.Print(" ")
		}
		fmt.Printf("%d:%U", i, r)
	}
	fmt.Println()
	fmt.Println(bad == string([]rune(bad)))
	// Output:
	// 5 3
	// 0:U+0047 1:U+006F 2:U+4E2D
	// false
	// 0:U+FFFD 1:U+0041
	// false
}
