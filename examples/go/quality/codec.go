package quality

import "encoding/json"

func Encode(values []int) ([]byte, error) { return json.Marshal(values) }
func Decode(data []byte) ([]int, error) {
	var values []int
	err := json.Unmarshal(data, &values)
	return values, err
}

// 这个有意保留的缺陷仅用于教学：前导零也是数据，不能擅自删除。
func EncodeBroken(values []int) ([]byte, error) {
	for len(values) > 0 && values[0] == 0 {
		values = values[1:]
	}
	return json.Marshal(values)
}
