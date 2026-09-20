package stream

import (
	"encoding/binary"
	"fmt"
	"io"
)

// ReadFrame 在分配载荷前校验上限；调用方负责读期限与连接关闭。
func ReadFrame(r io.Reader) ([]byte, error) {
	var header [4]byte
	if _, err := io.ReadFull(r, header[:]); err != nil {
		return nil, err
	}
	n := binary.BigEndian.Uint32(header[:])
	if n > 1<<20 {
		return nil, fmt.Errorf("frame too large: %d", n)
	}
	body := make([]byte, int(n))
	if _, err := io.ReadFull(r, body); err != nil {
		return nil, err
	}
	return body, nil
}
