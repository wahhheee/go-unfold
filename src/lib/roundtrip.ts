export type CodecMode = 'correct' | 'broken';
export function parseByteSample(source: string): number[] {
  if (source.length > 2048) throw new Error('输入不能超过 2048 个字符。');
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new Error('请输入有效的 JSON 数组。');
  }
  if (
    !Array.isArray(value) ||
    value.length > 64 ||
    !value.every(
      (item) => typeof item === 'number' && Number.isInteger(item) && item >= 0 && item <= 255,
    )
  )
    throw new Error('需要最多 64 个、范围 0 到 255 的整数。');
  return value;
}
export function roundTrip(values: number[], mode: CodecMode) {
  let start = 0;
  if (mode === 'broken') {
    while (start < values.length && values[start] === 0) start++;
  }
  const encoded = JSON.stringify(values.slice(start));
  const decoded: number[] = JSON.parse(encoded);
  return {
    encoded,
    decoded,
    passed:
      values.length === decoded.length && values.every((value, index) => value === decoded[index]),
  };
}
