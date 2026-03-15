import type { ReactNode } from "react";

type KpiCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function KpiCard({ title, value, subtitle, actions }: KpiCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        {actions}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </section>
  );
}
