"use client";

import { useMemo, useState } from "react";
import { CompareMonths } from "@/components/CompareMonths";
import { FilterMonthYear } from "@/components/FilterMonthYear";
import { GlosaLineChart } from "@/components/GlosaLineChart";
import { KpiCard } from "@/components/KpiCard";
import { MotivoRanking } from "@/components/MotivoRanking";
import { ResourceRiskMosaic } from "@/components/ResourceRiskMosaic";
import { RiskBarChart } from "@/components/RiskBarChart";
import { useGlosaData } from "@/hooks/useGlosaData";
import { groupBy, normalizeRiskBand, sum, topN } from "@/lib/aggregate";
import { formatCurrencyBRL, formatMonthLabel } from "@/lib/format";
import type { RiskBand } from "@/types/glosa";

function toYearMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function riskSeverity(risk: RiskBand): number {
  if (risk === "Alto") return 3;
  if (risk === "Médio") return 2;
  return 1;
}

function extractYearMonth(
  anoMes: string,
): { year: number; month: number } | null {
  const [yearRaw, monthRaw] = anoMes.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

type PeriodOption = {
  key: string;
  year: number;
  month: number;
};

type FilterPeriodValue = number | "all";

export default function Home() {
  const { loading, error, rows, updated_at } = useGlosaData();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const previousMonthDate = new Date(currentYear, currentMonth - 2, 1);

  const [riskYear, setRiskYear] = useState<FilterPeriodValue>(currentYear);
  const [riskMonth, setRiskMonth] = useState<FilterPeriodValue>(currentMonth);

  const [compareYearA, setCompareYearA] = useState(previousMonthDate.getFullYear());
  const [compareMonthA, setCompareMonthA] = useState(previousMonthDate.getMonth() + 1);
  const [compareYearB, setCompareYearB] = useState(currentYear);
  const [compareMonthB, setCompareMonthB] = useState(currentMonth);

  const [kpiYear, setKpiYear] = useState(currentYear);
  const [kpiMonthYear, setKpiMonthYear] = useState(currentYear);
  const [kpiMonthMonth, setKpiMonthMonth] = useState(currentMonth);

  const [rankingYear, setRankingYear] = useState<FilterPeriodValue>(currentYear);
  const [rankingMonth, setRankingMonth] = useState<FilterPeriodValue>(currentMonth);

  const periodOptions = useMemo(() => {
    const seen = new Set<string>();
    const periods: PeriodOption[] = [];

    rows.forEach((row) => {
      const parsed = extractYearMonth(row.ano_mes);
      if (!parsed || seen.has(row.ano_mes)) return;

      seen.add(row.ano_mes);
      periods.push({
        key: row.ano_mes,
        year: parsed.year,
        month: parsed.month,
      });
    });

    return periods.sort((a, b) => a.key.localeCompare(b.key));
  }, [rows]);

  const dataYears = useMemo(
    () => Array.from(new Set(periodOptions.map((item) => item.year))).sort((a, b) => b - a),
    [periodOptions],
  );

  const monthsByYear = useMemo(() => {
    const map: Record<number, number[]> = {};

    periodOptions.forEach((item) => {
      if (!map[item.year]) {
        map[item.year] = [];
      }
      map[item.year].push(item.month);
    });

    Object.keys(map).forEach((yearKey) => {
      const year = Number(yearKey);
      map[year] = Array.from(new Set(map[year])).sort((a, b) => a - b);
    });

    return map;
  }, [periodOptions]);

  const availablePeriodKeys = useMemo(
    () => new Set(periodOptions.map((item) => item.key)),
    [periodOptions],
  );

  const latestPeriod = periodOptions.length ? periodOptions[periodOptions.length - 1] : null;
  const currentPeriodKey = toYearMonthKey(currentYear, currentMonth);
  const hasCurrentPeriod = availablePeriodKeys.has(currentPeriodKey);
  const defaultYear = dataYears.includes(currentYear) ? currentYear : (dataYears[0] ?? currentYear);

  const defaultPeriod = hasCurrentPeriod
    ? { year: currentYear, month: currentMonth }
    : latestPeriod
      ? { year: latestPeriod.year, month: latestPeriod.month }
      : { year: currentYear, month: currentMonth };

  const resolvePeriod = (year: number, month: number): { year: number; month: number } => {
    if (!periodOptions.length) {
      return { year: currentYear, month: currentMonth };
    }

    const key = toYearMonthKey(year, month);
    if (availablePeriodKeys.has(key)) {
      return { year, month };
    }

    return defaultPeriod;
  };

  const resolvedRiskPeriod = resolvePeriod(
    typeof riskYear === "number" ? riskYear : defaultPeriod.year,
    typeof riskMonth === "number" ? riskMonth : defaultPeriod.month,
  );
  const resolvedKpiYear =
    dataYears.length === 0 ? currentYear : (dataYears.includes(kpiYear) ? kpiYear : defaultYear);
  const resolvedKpiMonthPeriod = resolvePeriod(kpiMonthYear, kpiMonthMonth);
  const resolvedRankingPeriod = resolvePeriod(
    typeof rankingYear === "number" ? rankingYear : defaultPeriod.year,
    typeof rankingMonth === "number" ? rankingMonth : defaultPeriod.month,
  );

  const riskYearSelection = riskYear === "all" ? "all" : resolvedRiskPeriod.year;
  const riskMonthSelection = riskMonth === "all" ? "all" : resolvedRiskPeriod.month;
  const rankingYearSelection = rankingYear === "all" ? "all" : resolvedRankingPeriod.year;
  const rankingMonthSelection = rankingMonth === "all" ? "all" : resolvedRankingPeriod.month;

  const riskMonthOptions = monthsByYear[resolvedRiskPeriod.year] ?? [];
  const kpiMonthOptions = monthsByYear[resolvedKpiMonthPeriod.year] ?? [];
  const rankingMonthOptions = monthsByYear[resolvedRankingPeriod.year] ?? [];

  const availableYears = useMemo(() => {
    return Array.from(
      new Set([
        ...dataYears,
        currentYear,
        compareYearA,
        compareYearB,
        kpiYear,
        kpiMonthYear,
        ...(typeof riskYear === "number" ? [riskYear] : []),
        ...(typeof rankingYear === "number" ? [rankingYear] : []),
      ]),
    ).sort((a, b) => b - a);
  }, [
    compareYearA,
    compareYearB,
    currentYear,
    dataYears,
    kpiMonthYear,
    kpiYear,
    rankingYear,
    riskYear,
  ]);

  const totalAllTime = useMemo(
    () => sum(rows, (row) => row.valor_glosado),
    [rows],
  );

  const totalSelectedYear = useMemo(
    () =>
      sum(
        rows.filter((row) => extractYearMonth(row.ano_mes)?.year === resolvedKpiYear),
        (row) => row.valor_glosado,
      ),
    [resolvedKpiYear, rows],
  );

  const totalSelectedMonth = useMemo(
    () =>
      sum(
        rows.filter(
          (row) =>
            row.ano_mes ===
            toYearMonthKey(resolvedKpiMonthPeriod.year, resolvedKpiMonthPeriod.month),
        ),
        (row) => row.valor_glosado,
      ),
    [resolvedKpiMonthPeriod, rows],
  );

  const riskData = useMemo(() => {
    const filtered = rows.filter((row) => {
      const period = extractYearMonth(row.ano_mes);
      if (!period) return false;
      if (riskYearSelection === "all") return true;
      if (period.year !== riskYearSelection) return false;
      if (riskMonthSelection === "all") return true;
      return period.month === riskMonthSelection;
    });
    const byResource = groupBy(filtered, (row) => row.recurso);

    return Object.entries(byResource)
      .map(([recurso, resourceRows]) => {
        const totalValor = sum(resourceRows, (row) => row.valor_glosado);

        // Regra usada: média do score do recurso no período filtrado
        const score =
          resourceRows.length > 0
            ? sum(resourceRows, (row) => row.score_risco_glosa) / resourceRows.length
            : 0;

        const dominantRisk = resourceRows.reduce<RiskBand>((risk, row) => {
          const current = normalizeRiskBand(row.faixa_risco);
          return riskSeverity(current) > riskSeverity(risk) ? current : risk;
        }, "Baixo");

        return {
          recurso,
          score,
          valorTotal: totalValor,
          riskBand: dominantRisk,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [riskMonthSelection, riskYearSelection, rows]);

  const lineData = useMemo(() => {
    const byMonth = groupBy(rows, (row) => row.ano_mes);

    return Object.entries(byMonth)
      .map(([anoMes, monthRows]) => ({
        anoMes,
        valor: sum(monthRows, (row) => row.valor_glosado),
      }))
      .sort((a, b) => a.anoMes.localeCompare(b.anoMes));
  }, [rows]);

  const monthValueMap = useMemo(() => {
    return lineData.reduce<Record<string, number>>((acc, item) => {
      acc[item.anoMes] = item.valor;
      return acc;
    }, {});
  }, [lineData]);

  const keyA = toYearMonthKey(compareYearA, compareMonthA);
  const keyB = toYearMonthKey(compareYearB, compareMonthB);
  const valueA = monthValueMap[keyA] ?? 0;
  const valueB = monthValueMap[keyB] ?? 0;
  const diffAbs = valueB - valueA;
  const diffPct = valueA === 0 ? null : (diffAbs / valueA) * 100;

  const motivoRankingData = useMemo(() => {
    const filtered = rows.filter((row) => {
      const period = extractYearMonth(row.ano_mes);
      if (!period) return false;
      if (rankingYearSelection === "all") return true;
      if (period.year !== rankingYearSelection) return false;
      if (rankingMonthSelection === "all") return true;
      return period.month === rankingMonthSelection;
    });

    const byMotivo = groupBy(filtered, (row) => row.motivo);

    const aggregated = Object.entries(byMotivo).map(([motivo, motivoRows]) => ({
      motivo,
      valor: sum(motivoRows, (row) => row.valor_glosado),
    }));

    return topN(aggregated, 7, (item) => item.valor);
  }, [rankingMonthSelection, rankingYearSelection, rows]);

  const mosaicData = useMemo(() => {
    const byResource = groupBy(rows, (row) => row.recurso);

    return Object.entries(byResource)
      .map(([recurso, resourceRows]) => {
        const valor = sum(resourceRows, (row) => row.valor_glosado);

        const dominantRisk = resourceRows.reduce<RiskBand>((risk, row) => {
          const current = normalizeRiskBand(row.faixa_risco);
          return riskSeverity(current) > riskSeverity(risk) ? current : risk;
        }, "Baixo");

        const total = resourceRows.length;
        const alto = resourceRows.filter((row) => row.flag_alto_risco === 1).length;
        const percentualAltoRisco = total > 0 ? Math.round((alto / total) * 100) : 0;

        return {
          recurso,
          valor,
          risco: dominantRisk,
          percentualAltoRisco,
        };
      })
      .sort((a, b) => b.valor - a.valor);
  }, [rows]);

  const dataYearOptions = dataYears.length ? dataYears : [currentYear];
  const kpiMonthYearOptions = dataYears.length ? dataYears : [currentYear];
  const rankingYearOptions = dataYears.length ? dataYears : [currentYear];
  const riskYearOptions = dataYears.length ? dataYears : [currentYear];

  const safeRiskMonthOptions = riskMonthOptions.length
    ? riskMonthOptions
    : [resolvedRiskPeriod.month];
  const safeKpiMonthOptions = kpiMonthOptions.length
    ? kpiMonthOptions
    : [resolvedKpiMonthPeriod.month];
  const safeRankingMonthOptions = rankingMonthOptions.length
    ? rankingMonthOptions
    : [resolvedRankingPeriod.month];

  const handleRiskYearChange = (year: FilterPeriodValue) => {
    if (year === "all") {
      setRiskYear("all");
      setRiskMonth("all");
      return;
    }

    const months = monthsByYear[year] ?? [];
    const nextMonth =
      riskMonth === "all"
        ? "all"
        : months.includes(resolvedRiskPeriod.month)
          ? resolvedRiskPeriod.month
          : (months[months.length - 1] ?? currentMonth);

    setRiskYear(year);
    setRiskMonth(nextMonth);
  };

  const handleKpiMonthYearChange = (year: number) => {
    const months = monthsByYear[year] ?? [];
    const nextMonth = months.includes(resolvedKpiMonthPeriod.month)
      ? resolvedKpiMonthPeriod.month
      : (months[months.length - 1] ?? currentMonth);

    setKpiMonthYear(year);
    setKpiMonthMonth(nextMonth);
  };

  const handleRankingYearChange = (year: FilterPeriodValue) => {
    if (year === "all") {
      setRankingYear("all");
      setRankingMonth("all");
      return;
    }

    const months = monthsByYear[year] ?? [];
    const nextMonth =
      rankingMonth === "all"
        ? "all"
        : months.includes(resolvedRankingPeriod.month)
          ? resolvedRankingPeriod.month
          : (months[months.length - 1] ?? currentMonth);

    setRankingYear(year);
    setRankingMonth(nextMonth);
  };

  const handleRiskMonthChange = (month: FilterPeriodValue) => {
    if (riskYear === "all" && month !== "all") {
      setRiskYear(defaultPeriod.year);
    }
    setRiskMonth(month);
  };

  const handleKpiMonthChange = (month: number) => {
    setKpiMonthYear(resolvedKpiMonthPeriod.year);
    setKpiMonthMonth(month);
  };

  const handleRankingMonthChange = (month: FilterPeriodValue) => {
    if (rankingYear === "all" && month !== "all") {
      setRankingYear(defaultPeriod.year);
    }
    setRankingMonth(month);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Monitoramento de Glosas</h1>
          <p className="mt-2 text-sm text-slate-600">
            Atualizado em: {updated_at ? new Date(updated_at).toLocaleString("pt-BR") : "-"}
          </p>
          <p className="text-sm text-slate-600">Registros carregados: {rows.length}</p>
        </header>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            Carregando dados...
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <KpiCard
            title="Valor Total da Glosa"
            value={formatCurrencyBRL(totalAllTime)}
            subtitle="All-time"
          />

          <KpiCard
            title="Total Glosa (Ano)"
            value={formatCurrencyBRL(totalSelectedYear)}
            subtitle={String(resolvedKpiYear)}
            actions={
              <label className="flex min-w-[96px] flex-col gap-1 text-[11px] font-medium text-slate-500">
                Ano
                <select
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                  value={resolvedKpiYear}
                  onChange={(event) => setKpiYear(Number(event.target.value))}
                >
                  {dataYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            }
          />

          <KpiCard
            title="Total Glosa (Mês)"
            value={formatCurrencyBRL(totalSelectedMonth)}
            subtitle={`${formatMonthLabel(resolvedKpiMonthPeriod.month)} / ${resolvedKpiMonthPeriod.year}`}
            actions={
              <div className="flex items-end gap-2">
                <label className="flex min-w-[96px] flex-col gap-1 text-[11px] font-medium text-slate-500">
                  Ano
                  <select
                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                    value={resolvedKpiMonthPeriod.year}
                    onChange={(event) => handleKpiMonthYearChange(Number(event.target.value))}
                  >
                    {kpiMonthYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex min-w-[112px] flex-col gap-1 text-[11px] font-medium text-slate-500">
                  Mês
                  <select
                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                    value={resolvedKpiMonthPeriod.month}
                    onChange={(event) => handleKpiMonthChange(Number(event.target.value))}
                  >
                    {safeKpiMonthOptions.map((month) => (
                      <option key={month} value={month}>
                        {formatMonthLabel(month)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            }
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Risco de Glosa</h2>
                <p className="text-sm text-slate-500">
                  Média do score por recurso no período.
                </p>
              </div>

              <FilterMonthYear
                year={riskYearSelection}
                month={riskMonthSelection}
                years={riskYearOptions}
                months={safeRiskMonthOptions}
                allowAll
                onYearChange={handleRiskYearChange}
                onMonthChange={handleRiskMonthChange}
              />
            </header>

            <RiskBarChart data={riskData} />
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Evolução - Valor Glosado
              </h2>
              <p className="text-sm text-slate-500">
                Somatório mensal em todo o histórico.
              </p>
            </header>

            <GlosaLineChart data={lineData} />
          </article>
        </section>

        <CompareMonths
          years={availableYears}
          yearA={compareYearA}
          monthA={compareMonthA}
          yearB={compareYearB}
          monthB={compareMonthB}
          valueA={valueA}
          valueB={valueB}
          diffAbs={diffAbs}
          diffPct={diffPct}
          onYearAChange={setCompareYearA}
          onMonthAChange={setCompareMonthA}
          onYearBChange={setCompareYearB}
          onMonthBChange={setCompareMonthB}
        />

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Ranking - Motivos de Glosa
                </h2>
                <p className="text-sm text-slate-500">
                  Top 7 motivos por valor glosado.
                </p>
              </div>

              <FilterMonthYear
                year={rankingYearSelection}
                month={rankingMonthSelection}
                years={rankingYearOptions}
                months={safeRankingMonthOptions}
                allowAll
                onYearChange={handleRankingYearChange}
                onMonthChange={handleRankingMonthChange}
              />
            </header>

            <MotivoRanking data={motivoRankingData} />
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Níveis de Recursos de Risco de Glosa
              </h2>
              <p className="text-sm text-slate-500">
                Mosaico proporcional aproximado ao valor glosado.
              </p>
            </header>

            <ResourceRiskMosaic data={mosaicData} />
          </article>
        </section>
      </div>
    </main>
  );
}
