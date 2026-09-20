export const wireBytes = [3, 67, 65, 84, 2, 79, 75];
export type StreamState = {
  cursor: number;
  pending: number[];
  messages: string[];
  reads: string[];
  ended: boolean;
  error: string | null;
};
export const newStream = (): StreamState => ({
  cursor: 0,
  pending: [],
  messages: [],
  reads: [],
  ended: false,
  error: null,
});
export function readStream(
  state: StreamState,
  amount: number,
  framing: boolean,
  truncate: boolean,
): StreamState {
  if (state.ended) return state;
  const wire = truncate ? wireBytes.slice(0, -1) : wireBytes;
  const chunk = wire.slice(state.cursor, state.cursor + amount);
  let pending = [...state.pending, ...chunk];
  const messages = [...state.messages];
  if (framing) {
    while (pending.length > 0 && pending.length >= pending[0] + 1) {
      messages.push(String.fromCharCode(...pending.slice(1, pending[0] + 1)));
      pending = pending.slice(pending[0] + 1);
    }
  } else if (chunk.length) {
    messages.push(String.fromCharCode(...chunk.map((byte) => (byte < 32 ? 63 : byte))));
    pending = [];
  }
  const cursor = state.cursor + chunk.length;
  // 单独一次读取观察 EOF，最后一个数据块本身不等于已经观察到关闭。
  const ended = chunk.length === 0;
  return {
    cursor,
    pending,
    messages,
    reads: chunk.length
      ? [...state.reads, chunk.map((b) => (b < 32 ? `[${b}]` : String.fromCharCode(b))).join('')]
      : state.reads,
    ended,
    error: ended && pending.length ? '帧尚未收齐就遇到 EOF：截断，不能交付半条消息。' : null,
  };
}
