import { lazy, Suspense, useState } from 'react';
import { FlaskConical, Play, RotateCcw } from 'lucide-react';
import { parseByteSample, roundTrip } from '../lib/roundtrip';
import type { CodecMode } from '../lib/roundtrip';
import { useLearning } from '../state/learning';
const JsonEditor = lazy(() =>
  import('./JsonEditor').then((module) => ({ default: module.JsonEditor })),
);
export function RoundTripLab() {
  const [source, setSource] = useState('[1, 2, 3]'),
    [mode, setMode] = useState<CodecMode>('broken'),
    [error, setError] = useState(''),
    [result, setResult] = useState<ReturnType<typeof roundTrip> | null>(null);
  const { update } = useLearning();
  function clear() {
    setError('');
    setResult(null);
  }
  return (
    <section className="framed-tool concept-lab" aria-label="反例发现实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>反例发现实验</strong>
        </div>
        <button
          className="icon-button"
          aria-label="重置反例实验"
          title="重置反例实验"
          onClick={() => {
            setSource('[1, 2, 3]');
            setMode('broken');
            clear();
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="concept-controls">
        <label>
          编码实现
          <select
            aria-label="编码实现"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as CodecMode);
              clear();
            }}
          >
            <option value="broken">缺陷版：移除前导零</option>
            <option value="correct">保留全部元素</option>
          </select>
        </label>
        <label>
          样例
          <select
            aria-label="输入样例"
            value={['[1, 2, 3]', '[0, 1]', '[0]', '[]'].includes(source) ? source : 'custom'}
            onChange={(e) => {
              setSource(e.target.value);
              clear();
            }}
          >
            <option value="[1, 2, 3]">普通序列</option>
            <option value="[0, 1]">包含前导零</option>
            <option value="[0]">最小反例</option>
            <option value="[]">空序列</option>
            <option value="custom" disabled>
              自定义输入
            </option>
          </select>
        </label>
      </div>
      <div className="roundtrip-editor">
        <Suspense fallback={<p>加载编辑器...</p>}>
          <JsonEditor
            label="往返测试 JSON 输入"
            maxLength={2048}
            value={source}
            onChange={(value) => {
              setSource(value);
              clear();
            }}
          />
        </Suspense>
      </div>
      <div className="concept-controls">
        <button
          className="button small"
          onClick={() => {
            try {
              setResult(roundTrip(parseByteSample(source), mode));
              setError('');
              update({ labRan: true });
            } catch (error) {
              setError(error instanceof Error ? error.message : '输入无法解析');
              setResult(null);
            }
          }}
        >
          <Play size={14} />
          验证往返性质
        </button>
      </div>
      {error && (
        <p className="concept-error" role="alert">
          {error}
        </p>
      )}
      <div className="roundtrip-output">
        <span>
          编码后 <code>{result?.encoded ?? '待验证'}</code>
        </span>
        <span>
          解码后 <code>{result ? JSON.stringify(result.decoded) : '待验证'}</code>
        </span>
      </div>
      <p className="concept-result" role="status">
        {result
          ? result.passed
            ? '本次样例通过；不能证明所有输入都通过。'
            : '性质失败：元素序列发生变化，这个输入就是反例。'
          : '目标性质：解码编码后的结果，元素序列应与输入相同。'}
      </p>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>
          最多 64 个 0 到 255 的整数，用 JSON
          原生编解码执行浏览器等价模型。缺陷版故意丢失前导零；对应 Go 示例使用 []int，避免 []byte 的
          base64 编码特例。这里不随机执行 Go、不做自动反例缩减；真正的 Go fuzz 入口在
          examples/go/quality。
        </p>
      </details>
    </section>
  );
}
