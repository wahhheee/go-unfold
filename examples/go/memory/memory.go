package memory

import (
	"bytes"
	"sync"
)

func Local() int { p := new(int); *p = 7; return *p }

var Saved *int

func Save() { value := 7; Saved = &value }

var buffers = sync.Pool{New: func() any { return new(bytes.Buffer) }}

func Encode(value string) []byte {
	b := buffers.Get().(*bytes.Buffer)
	b.Reset()
	defer buffers.Put(b)
	b.WriteString(value)
	return bytes.Clone(b.Bytes())
}
