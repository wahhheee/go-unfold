import type { ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';

export function NetworkLabShell({
  title,
  badge,
  children,
  message,
  assumptions,
}: {
  title: string;
  badge: string;
  children: ReactNode;
  message: string;
  assumptions: string;
}) {
  return (
    <section className="framed-tool concept-lab network-lab" aria-label={title}>
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>{title}</strong>
        </div>
        <span className="live-label">{badge}</span>
      </div>
      {children}
      <p className="concept-result" role="status">
        {message}
      </p>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>{assumptions}</p>
      </details>
    </section>
  );
}
export function NetworkCells({
  cells,
}: {
  cells: { title: string; value: string; detail?: string; active?: boolean }[];
}) {
  return (
    <div className="network-cells">
      {cells.map((cell) => (
        <div key={cell.title} className={`network-cell ${cell.active ? 'is-active' : ''}`}>
          <span>{cell.title}</span>
          <strong>{cell.value}</strong>
          {cell.detail && <small>{cell.detail}</small>}
        </div>
      ))}
    </div>
  );
}
