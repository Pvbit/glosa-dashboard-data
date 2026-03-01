type KpiCardProps = {
  title: string;
  value: string;
  subtitle?: string;
};

export function KpiCard({ title, value, subtitle }: KpiCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </section>
  );
}
