import { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { tlsView } from '../lib/tls-model';
import type { TlsConfig } from '../lib/tls-model';
import { NetworkCells, NetworkLabShell } from './NetworkLabShell';
import { useLearning } from '../state/learning';
export function TlsLab() {
  const [config, setConfig] = useState<TlsConfig>({
    trust: true,
    name: true,
    valid: true,
    alpn: true,
  });
  const [step, setStep] = useState(0);
  const { update } = useLearning();
  const v = tlsView(config, step);
  return (
    <NetworkLabShell
      title="TLS 身份与协议协商实验"
      badge={v.failed ? '已拒绝' : v.complete ? '已完成' : `阶段 ${step} / 4`}
      message={v.message}
      assumptions="只演示 TLS 1.3 完整服务端认证握手，双方启用 ALPN；布尔条件代替真实密码运算与证书验证，阶段不对应 TCP 包数或精确 RTT。省略 HelloRetryRequest、客户端证书、PSK 恢复、0-RTT、吊销策略与 ECH。真实校验由 crypto/tls 样本补充。"
    >
      <div className="concept-controls">
        {(
          [
            ['trust', '信任签发链'],
            ['name', '服务名字匹配'],
            ['valid', '证书在有效期内'],
            ['alpn', '存在共同 ALPN'],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={config[key]}
              onChange={(e) => {
                setConfig({ ...config, [key]: e.target.checked });
                setStep(0);
              }}
            />
            {label}
          </label>
        ))}
      </div>
      <div className="network-route">
        {v.labels.map((label, i) => (
          <span key={label} aria-current={i === v.actual ? 'step' : undefined}>
            {i > 0 && <ArrowRight size={14} />}
            <strong>
              {i < v.actual ? '✓ ' : i === v.actual ? '→ ' : ''}
              {label}
            </strong>
          </span>
        ))}
      </div>
      <NetworkCells
        cells={[
          {
            title: '期望服务',
            value: 'api.example.test',
            detail: '由调用目标决定，不由证书自报身份决定',
          },
          {
            title: '验证状态',
            value: v.failed ? v.failure! : step < 3 ? '尚未完成' : '已通过本模型检查',
            active: step >= 3 && !v.failed,
          },
          {
            title: '应用数据',
            value: v.complete ? '允许发送' : '等待握手',
            detail: v.complete ? 'ALPN：h2' : '协商完成前不发送普通业务请求',
          },
        ]}
      />
      <div className="concept-controls">
        <button
          className="button small"
          disabled={v.failed || v.complete}
          onClick={() => {
            setStep(step + 1);
            update({ labRan: true });
          }}
        >
          <ShieldCheck size={15} />
          推进握手
        </button>
        <button className="button small secondary" onClick={() => setStep(0)}>
          重置握手
        </button>
      </div>
    </NetworkLabShell>
  );
}
