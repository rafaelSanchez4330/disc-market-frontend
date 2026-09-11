import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-ink-soft px-6 py-16 text-center">
      <p className="font-display text-2xl">{title}</p>
      {children ? <div className="mt-4 text-muted">{children}</div> : null}
    </div>
  );
}
