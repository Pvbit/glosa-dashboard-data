import type { ReactNode } from "react";

type RiskGaugeLevel = "Baixo" | "Medio" | "Alto";

type RiskGaugeProps = {
  score: number;
  level: RiskGaugeLevel;
  summary: string;
  supportText: string;
  actions?: ReactNode;
};

const LEVEL_STYLES: Record<
  RiskGaugeLevel,
  {
    label: string;
    badgeClassName: string;
    supportClassName: string;
    accentClassName: string;
    panelClassName: string;
  }
> = {
  Baixo: {
    label: "Baixo",
    badgeClassName: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30",
    supportClassName: "text-emerald-700",
    accentClassName: "text-emerald-600",
    panelClassName: "from-emerald-500/14 via-emerald-500/5 to-white",
  },
  Medio: {
    label: "Medio",
    badgeClassName: "bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30",
    supportClassName: "text-amber-700",
    accentClassName: "text-amber-600",
    panelClassName: "from-amber-400/18 via-amber-300/8 to-white",
  },
  Alto: {
    label: "Alto",
    badgeClassName: "bg-rose-600 text-white shadow-sm shadow-rose-600/30",
    supportClassName: "text-rose-700",
    accentClassName: "text-rose-600",
    panelClassName: "from-rose-500/18 via-rose-400/8 to-white",
  },
};

function clampScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(100, Math.max(0, score));
}

export function RiskGauge({ score, level, summary, supportText, actions }: RiskGaugeProps) {
  const safeScore = clampScore(score);
  const levelStyle = LEVEL_STYLES[level];
  const gaugeRotation = `${Math.min(180, Math.max(0, (safeScore / 100) * 180))}deg`;

  return (
    <section
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br ${levelStyle.panelClassName} p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]`}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Painel executivo
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Termômetro de Risco de Glosa
          </h2>
          <p className="mt-1 text-sm text-slate-600">Score médio do período selecionado</p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          {actions ? (
            <div className="rounded-2xl border border-white/70 bg-white/85 p-3 shadow-sm backdrop-blur">
              {actions}
            </div>
          ) : null}
          <span
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${levelStyle.badgeClassName}`}
          >
            Risco {levelStyle.label}
          </span>
        </div>
      </header>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] xl:items-center">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate-500">Score numérico</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-6xl font-semibold leading-none tracking-tight text-slate-950">
                {safeScore.toFixed(1)}
              </span>
              <span className="pb-2 text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                /100
              </span>
            </div>
            <p className={`mt-3 text-sm font-semibold ${levelStyle.accentClassName}`}>
              Faixa de risco: {levelStyle.label}
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <span>Baixo</span>
              <span>Médio</span>
              <span>Alto</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-200">
              <div className="flex h-full">
                <div className="w-[40%] bg-emerald-500" />
                <div className="w-[30%] bg-amber-400" />
                <div className="w-[30%] bg-rose-600" />
              </div>
            </div>
            <div className="relative h-2 rounded-full bg-slate-200/80">
              <div
                className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-slate-950 shadow-lg"
                style={{ left: `${safeScore}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200/80 bg-white/88 p-5 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-[320px] flex-col items-center">
            <div className="relative h-44 w-72 overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-72 rounded-full bg-[conic-gradient(from_180deg_at_50%_100%,#10b981_0deg_72deg,#fbbf24_72deg_126deg,#e11d48_126deg_180deg,#e2e8f0_180deg_360deg)]" />
              <div className="absolute inset-x-5 bottom-5 h-56 rounded-full bg-white" />
              <div
                className="absolute bottom-1 left-1/2 z-10 h-24 w-1.5 origin-bottom -translate-x-1/2 rounded-full bg-slate-900 shadow-[0_0_20px_rgba(15,23,42,0.18)]"
                style={{ transform: `translateX(-50%) rotate(${gaugeRotation})` }}
              />
              <div className="absolute bottom-0 left-1/2 z-20 h-5 w-5 -translate-x-1/2 rounded-full border-4 border-white bg-slate-900" />
              <div className="absolute inset-x-0 bottom-10 text-center">
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">
                  Gauge executivo
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                  {safeScore.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="mt-2 grid w-full grid-cols-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <span className="text-left">Baixo</span>
              <span className="text-center">Médio</span>
              <span className="text-right">Alto</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(240px,0.7fr)]">
        <div className="rounded-2xl border border-white/80 bg-white/88 p-4 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Leitura inteligente
          </p>
          <p className="mt-2 text-sm text-slate-700">{summary}</p>
        </div>
        <div className="rounded-2xl border border-white/80 bg-white/88 p-4 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Status
          </p>
          <p className={`mt-2 text-base font-semibold ${levelStyle.supportClassName}`}>
            {supportText}
          </p>
        </div>
      </div>
    </section>
  );
}

export type { RiskGaugeLevel };
