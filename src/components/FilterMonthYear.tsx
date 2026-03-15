import { MONTHS_PT_BR } from "@/lib/format";

type FilterMonthYearProps = {
  label?: string;
  year: number;
  month: number;
  years: number[];
  months?: number[];
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
};

export function FilterMonthYear({
  label,
  year,
  month,
  years,
  months,
  onYearChange,
  onMonthChange,
}: FilterMonthYearProps) {
  const monthOptions = months?.length ? months : MONTHS_PT_BR.map((_, index) => index + 1);

  return (
    <div className="flex flex-wrap items-end gap-3">
      {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
      <label className="flex min-w-[120px] flex-col gap-1 text-xs font-medium text-slate-500">
        Ano
        <select
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          value={year}
          onChange={(event) => onYearChange(Number(event.target.value))}
        >
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[140px] flex-col gap-1 text-xs font-medium text-slate-500">
        Mês
        <select
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          value={month}
          onChange={(event) => onMonthChange(Number(event.target.value))}
        >
          {monthOptions.map((monthValue) => {
            const monthLabel = MONTHS_PT_BR[monthValue - 1];
            return (
              <option key={monthValue} value={monthValue}>
                {monthLabel}
              </option>
            );
          })}
        </select>
      </label>
    </div>
  );
}
