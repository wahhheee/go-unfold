import { useRef, useState } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { Check, Copy } from 'lucide-react';

export function CodeBlock(props: ComponentPropsWithoutRef<'pre'> & { 'data-language'?: string }) {
  const pre = useRef<HTMLPreElement>(null);
  const [status, setStatus] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(pre.current?.textContent || '');
      setStatus('已复制');
    } catch {
      setStatus('复制失败，请选择代码复制');
    }
    window.setTimeout(() => setStatus(''), 2500);
  }
  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>{props['data-language'] || 'CODE'}</span>
        <div>
          <span role="status">{status}</span>
          <button className="icon-button" aria-label="复制代码" title="复制代码" onClick={copy}>
            {status === '已复制' ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      </div>
      <pre ref={pre} tabIndex={0} aria-label={`${props['data-language'] || ''} 代码`} {...props} />
    </div>
  );
}
