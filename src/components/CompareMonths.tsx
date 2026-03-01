import { FilterMonthYear } from "@/components/FilterMonthYear";
import { formatCurrencyBRL } from "@/lib/format";

type CompareMonthsProps = {
  years: number[];
  yearA: number;
  monthA: number;
  yearB: number;
  monthB: number;
  valueA: number;
  valueB: number;
  diffAbs: number;
  diffPct: number | null;
  onYearAChange: (year: number) => void;
  onMonthAChange: (month: number) => void;
  onYearBChange: (year: number) => void;
  onMonthBChange: (month: number) => void;
};

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return `${value.toFixed(2)}%`;
}

export function CompareMonths({
  years,
  yearA,
  monthA,
  yearB,
  monthB,
  valueA,
  valueB,
  diffAbs,
  diffPct,
  onYearAChange,
  onMonthAChange,
  onYearBChange,
  onMonthBChange,
}: CompareMonthsProps) {
  const diffColor = diffAbs > 0 ? "text-red-600" : diffAbs < 0 ? "text-emerald-600" : "text-slate-700";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Comparativo Valor Glosado</h2>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <FilterMonthYear
            label="Periodo A"
            year={yearA}
            month={monthA}
            years={years}
            onYearChange={onYearAChange}
            onMonthChange={onMonthAChange}
          />
          <p className="mt-3 text-xl font-bold text-slate-900">{formatCurrencyBRL(valueA)}</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <FilterMonthYear
            label="Periodo B"
            year={yearB}
            month={monthB}
            years={years}
            onYearChange={onYearBChange}
            onMonthChange={onMonthBChange}
          />
          <p className="mt-3 text-xl font-bold text-slate-900">{formatCurrencyBRL(valueB)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
        <p>
          Diferenca absoluta (B - A): <span className={`font-semibold ${diffColor}`}>{formatCurrencyBRL(diffAbs)}</span>
        </p>
        <p>
          Diferenca percentual (B - A): <span className={`font-semibold ${diffColor}`}>{formatPercent(diffPct)}</span>
        </p>
      </div>
    </section>
  );
}
