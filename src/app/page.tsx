"use client";

import { useMemo, useState } from "react";
import { CompareMonths } from "@/components/CompareMonths";
import { FilterMonthYear } from "@/components/FilterMonthYear";
import { GlosaLineChart } from "@/components/GlosaLineChart";
import { KpiCard } from "@/components/KpiCard";
import { MotivoRanking } from "@/components/MotivoRanking";
import { RiskBarChart } from "@/components/RiskBarChart";
import { RiskGauge, type RiskGaugeLevel } from "@/components/RiskGauge";
import { useGlosaData } from "@/hooks/useGlosaData";
import { groupBy, normalizeRiskBand, sum, topN } from "@/lib/aggregate";
import { formatCurrencyBRL, formatMonthLabel } from "@/lib/format";
import type { GlosaRow, RiskBand } from "@/types/glosa";

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

function classifyRiskLevel(score: number): RiskGaugeLevel {
  if (score >= 70) return "Alto";
  if (score >= 40) return "Medio";
  return "Baixo";
}

function buildRiskSummary(rows: GlosaRow[]): string {
  if (!rows.length) {
    return "Sem dados suficientes para apontar foco de risco no periodo selecionado.";
  }

  const highestScore = rows.reduce((max, row) => Math.max(max, row.score_risco_glosa), 0);
  const focusRows = rows.filter((row) => row.score_risco_glosa === highestScore);
  const prioritizedRows = focusRows.length ? focusRows : rows;

  const topResource = Object.entries(
    groupBy(
      prioritizedRows.filter((row) => row.recurso.trim().length > 0),
      (row) => row.recurso,
    ),
  )
    .map(([recurso, resourceRows]) => ({
      label: recurso,
      total: sum(resourceRows, (row) => row.valor_glosado),
    }))
    .sort((a, b) => b.total - a.total)[0];

  if (topResource) {
    return `Maior concentracao de risco no recurso ${topResource.label}.`;
  }

  const topReason = Object.entries(
    groupBy(
      prioritizedRows.filter((row) => row.motivo.trim().length > 0),
      (row) => row.motivo,
    ),
  )
    .map(([motivo, motivoRows]) => ({
      label: motivo,
      total: sum(motivoRows, (row) => row.valor_glosado),
    }))
    .sort((a, b) => b.total - a.total)[0];

  if (topReason) {
    return `Maior concentracao de risco no motivo ${topReason.label}.`;
  }

  const topArea = Object.entries(
    groupBy(
      prioritizedRows.filter((row) => row.area.trim().length > 0),
      (row) => row.area,
    ),
  )
    .map(([area, areaRows]) => ({
      label: area,
      total: sum(areaRows, (row) => row.valor_glosado),
    }))
    .sort((a, b) => b.total - a.total)[0];

  if (topArea) {
    return `Maior concentracao de risco na area ${topArea.label}.`;
  }

  return "Sem agrupamento suficiente para resumir a concentracao de risco.";
}

type PeriodOption = {
  key: string;
  year: number;
  month: number;
};

type FilterPeriodValue = number | "all";

function filterRowsByPeriod(
  rows: GlosaRow[],
  year: FilterPeriodValue,
  month: FilterPeriodValue,
): GlosaRow[] {
  return rows.filter((row) => {
    const period = extractYearMonth(row.ano_mes);
    if (!period) return false;
    if (year === "all" && month === "all") return true;
    if (year !== "all" && period.year !== year) return false;
    if (month === "all") return true;
    return period.month === month;
  });
}

export default function Home() {
  const { loading, error, rows, updated_at } = useGlosaData();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const previousMonthDate = new Date(currentYear, currentMonth - 2, 1);

  const [thermometerYear, setThermometerYear] = useState<FilterPeriodValue>(currentYear);
  const [thermometerMonth, setThermometerMonth] = useState<FilterPeriodValue>(currentMonth);
  const [riskChartYear, setRiskChartYear] = useState<FilterPeriodValue>(currentYear);
  const [riskChartMonth, setRiskChartMonth] = useState<FilterPeriodValue>(currentMonth);
  const [globalYear, setGlobalYear] = useState<number | "Todos">("Todos");
  const [globalMonth, setGlobalMonth] = useState<number | "Todos">("Todos");

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
    typeof thermometerYear === "number" ? thermometerYear : defaultPeriod.year,
    typeof thermometerMonth === "number" ? thermometerMonth : defaultPeriod.month,
  );
  const resolvedRiskChartPeriod = resolvePeriod(
    typeof riskChartYear === "number" ? riskChartYear : defaultPeriod.year,
    typeof riskChartMonth === "number" ? riskChartMonth : defaultPeriod.month,
  );
  const resolvedKpiYear =
    dataYears.length === 0 ? currentYear : (dataYears.includes(kpiYear) ? kpiYear : defaultYear);
  const resolvedKpiMonthPeriod = resolvePeriod(kpiMonthYear, kpiMonthMonth);
  const resolvedRankingPeriod = resolvePeriod(
    typeof rankingYear === "number" ? rankingYear : defaultPeriod.year,
    typeof rankingMonth === "number" ? rankingMonth : defaultPeriod.month,
  );

  const globalMonthOptions = useMemo(() => {
    if (typeof globalYear === "number") {
      return monthsByYear[globalYear] ?? [];
    }

    return Array.from(new Set(periodOptions.map((item) => item.month))).sort((a, b) => a - b);
  }, [globalYear, monthsByYear, periodOptions]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const period = extractYearMonth(row.ano_mes);
      if (!period) return false;

      if (globalYear === "Todos" && globalMonth === "Todos") {
        return true;
      }

      if (typeof globalYear === "number" && globalMonth === "Todos") {
        return period.year === globalYear;
      }

      if (typeof globalYear === "number" && typeof globalMonth === "number") {
        return period.year === globalYear && period.month === globalMonth;
      }

      return typeof globalMonth === "number" ? period.month === globalMonth : true;
    });
  }, [globalMonth, globalYear, rows]);

  const thermometerYearSelection =
    thermometerYear === "all" ? "all" : resolvedRiskPeriod.year;
  const thermometerMonthSelection =
    thermometerMonth === "all" ? "all" : resolvedRiskPeriod.month;
  const riskChartYearSelection =
    riskChartYear === "all" ? "all" : resolvedRiskChartPeriod.year;
  const riskChartMonthSelection =
    riskChartMonth === "all" ? "all" : resolvedRiskChartPeriod.month;
  const rankingYearSelection = rankingYear === "all" ? "all" : resolvedRankingPeriod.year;
  const rankingMonthSelection = rankingMonth === "all" ? "all" : resolvedRankingPeriod.month;

  const riskChartMonthOptions =
    typeof riskChartYearSelection === "number" ? monthsByYear[riskChartYearSelection] ?? [] : [];
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
        ...(typeof riskChartYear === "number" ? [riskChartYear] : []),
        ...(typeof thermometerYear === "number" ? [thermometerYear] : []),
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
    riskChartYear,
    rankingYear,
    thermometerYear,
  ]);

  const totalAllTime = useMemo(
    () => sum(filteredRows, (row) => row.valor_glosado),
    [filteredRows],
  );

  const totalSelectedYear = useMemo(
    () =>
      sum(
        filteredRows.filter((row) => extractYearMonth(row.ano_mes)?.year === resolvedKpiYear),
        (row) => row.valor_glosado,
      ),
    [filteredRows, resolvedKpiYear],
  );

  const totalSelectedMonth = useMemo(
    () =>
      sum(
        filteredRows.filter(
          (row) =>
            row.ano_mes ===
            toYearMonthKey(resolvedKpiMonthPeriod.year, resolvedKpiMonthPeriod.month),
        ),
        (row) => row.valor_glosado,
      ),
    [filteredRows, resolvedKpiMonthPeriod],
  );

  const thermometerRows = useMemo(
    () => filterRowsByPeriod(rows, thermometerYearSelection, thermometerMonthSelection),
    [rows, thermometerMonthSelection, thermometerYearSelection],
  );

  const generalRisk = useMemo(() => {
    const score =
      thermometerRows.length > 0
        ? sum(thermometerRows, (row) => row.score_risco_glosa) / thermometerRows.length
        : 0;
    const level = classifyRiskLevel(score);
    const summary = buildRiskSummary(thermometerRows);
    const supportText =
      level === "Alto"
        ? "Requer atencao imediata"
        : level === "Medio"
          ? "Monitoramento recomendado"
          : "Situacao sob controle";

    return {
      score,
      level,
      summary,
      supportText,
    };
  }, [thermometerRows]);

  const riskData = useMemo(() => {
    const byResource = groupBy(
      filterRowsByPeriod(filteredRows, riskChartYearSelection, riskChartMonthSelection),
      (row) => row.recurso,
    );

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
  }, [filteredRows, riskChartMonthSelection, riskChartYearSelection]);

  const lineData = useMemo(() => {
    const byMonth = groupBy(filteredRows, (row) => row.ano_mes);

    return Object.entries(byMonth)
      .map(([anoMes, monthRows]) => ({
        anoMes,
        valor: sum(monthRows, (row) => row.valor_glosado),
      }))
      .sort((a, b) => a.anoMes.localeCompare(b.anoMes));
  }, [filteredRows]);

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
    const filtered = filteredRows.filter((row) => {
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
  }, [filteredRows, rankingMonthSelection, rankingYearSelection]);

  const dataYearOptions = dataYears.length ? dataYears : [currentYear];
  const kpiMonthYearOptions = dataYears.length ? dataYears : [currentYear];
  const rankingYearOptions = dataYears.length ? dataYears : [currentYear];
  const riskChartYearOptions = dataYears.length ? dataYears : [currentYear];
  const thermometerYearOptions = dataYears.length ? dataYears : [currentYear];

  const safeRiskChartMonthOptions = riskChartMonthOptions.length
    ? riskChartMonthOptions
    : [resolvedRiskChartPeriod.month];
  const thermometerMonthOptions =
    typeof thermometerYearSelection === "number"
      ? monthsByYear[thermometerYearSelection] ?? []
      : Array.from(new Set(periodOptions.map((item) => item.month))).sort((a, b) => a - b);
  const safeThermometerMonthOptions = thermometerMonthOptions.length
    ? thermometerMonthOptions
    : [resolvedRiskPeriod.month];
  const safeKpiMonthOptions = kpiMonthOptions.length
    ? kpiMonthOptions
    : [resolvedKpiMonthPeriod.month];
  const safeRankingMonthOptions = rankingMonthOptions.length
    ? rankingMonthOptions
    : [resolvedRankingPeriod.month];

  const handleThermometerYearChange = (year: FilterPeriodValue) => {
    if (year === "all") {
      setThermometerYear("all");
      setThermometerMonth("all");
      return;
    }

    const months = monthsByYear[year] ?? [];
    const nextMonth =
      thermometerMonth === "all"
        ? "all"
        : months.includes(resolvedRiskPeriod.month)
          ? resolvedRiskPeriod.month
          : (months[months.length - 1] ?? currentMonth);

    setThermometerYear(year);
    setThermometerMonth(nextMonth);
  };

  const handleRiskChartYearChange = (year: FilterPeriodValue) => {
    if (year === "all") {
      setRiskChartYear("all");
      setRiskChartMonth("all");
      return;
    }

    const months = monthsByYear[year] ?? [];
    const nextMonth =
      riskChartMonth === "all"
        ? "all"
        : months.includes(resolvedRiskChartPeriod.month)
          ? resolvedRiskChartPeriod.month
          : (months[months.length - 1] ?? currentMonth);

    setRiskChartYear(year);
    setRiskChartMonth(nextMonth);
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

  const handleThermometerMonthChange = (month: FilterPeriodValue) => {
    if (thermometerYear === "all" && month !== "all") {
      setThermometerYear(defaultPeriod.year);
    }
    setThermometerMonth(month);
  };

  const handleRiskChartMonthChange = (month: FilterPeriodValue) => {
    if (riskChartYear === "all" && month !== "all") {
      setRiskChartYear(defaultPeriod.year);
    }
    setRiskChartMonth(month);
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

  const handleGlobalYearChange = (year: FilterPeriodValue) => {
    if (year === "all") {
      setGlobalYear("Todos");
      setGlobalMonth("Todos");
      return;
    }

    const months = monthsByYear[year] ?? [];
    const nextMonth =
      globalMonth === "Todos"
        ? "Todos"
        : months.includes(globalMonth)
          ? globalMonth
          : "Todos";

    setGlobalYear(year);
    setGlobalMonth(nextMonth);
  };

  const handleGlobalMonthChange = (month: FilterPeriodValue) => {
    if (month === "all") {
      setGlobalMonth("Todos");
      return;
    }

    if (globalYear === "Todos") {
      setGlobalYear(defaultPeriod.year);
    }

    setGlobalMonth(month);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Monitoramento de Glosas</h1>
          <div className="mt-4">
            <FilterMonthYear
              label="Filtro global"
              year={globalYear === "Todos" ? "all" : globalYear}
              month={globalMonth === "Todos" ? "all" : globalMonth}
              years={dataYearOptions}
              months={globalMonthOptions}
              allowAll
              onYearChange={handleGlobalYearChange}
              onMonthChange={handleGlobalMonthChange}
            />
          </div>
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

        <section className="grid gap-4">
          <RiskGauge
            score={generalRisk.score}
            level={generalRisk.level}
            summary={generalRisk.summary}
            supportText={generalRisk.supportText}
            actions={
              <FilterMonthYear
                year={thermometerYearSelection}
                month={thermometerMonthSelection}
                years={thermometerYearOptions}
                months={safeThermometerMonthOptions}
                allowAll
                onYearChange={handleThermometerYearChange}
                onMonthChange={handleThermometerMonthChange}
              />
            }
          />

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Risco de Glosa</h2>
                <p className="text-sm text-slate-500">
                  Média do score por recurso no recorte global.
                </p>
              </div>
              <FilterMonthYear
                year={riskChartYearSelection}
                month={riskChartMonthSelection}
                years={riskChartYearOptions}
                months={safeRiskChartMonthOptions}
                allowAll
                onYearChange={handleRiskChartYearChange}
                onMonthChange={handleRiskChartMonthChange}
              />
            </header>

            <RiskBarChart data={riskData} />
          </article>
        </section>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Evolução - Valor Glosado</h2>
            <p className="text-sm text-slate-500">Somatório mensal no recorte global.</p>
          </header>

          <GlosaLineChart data={lineData} />
        </article>

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

        <section className="grid gap-4">
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
        </section>
      </div>
    </main>
  );
}
