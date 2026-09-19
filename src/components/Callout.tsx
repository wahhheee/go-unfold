import type { ReactNode } from 'react';
import { Lightbulb, ShieldCheck, TriangleAlert } from 'lucide-react';

export function Callout({
  title,
  kind = 'note',
  children,
}: {
  title: string;
  kind?: 'note' | 'warning' | 'fact';
  children: ReactNode;
}) {
  const Icon = kind === 'warning' ? TriangleAlert : kind === 'fact' ? ShieldCheck : Lightbulb;
  return (
    <aside className={`callout ${kind}`}>
      <Icon size={19} />
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    </aside>
  );
}
