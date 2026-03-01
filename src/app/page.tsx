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
  if (risk === "Alto") {
    return 3;
  }
  if (risk === "Médio") {
    return 2;
  }
  return 1;
}

function extractYearMonth(anoMes: string): { year: number; month: number } | null {
  const [yearRaw, monthRaw] = anoMes.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

export default function Home() {
  const { loading, error, rows, updated_at } = useGlosaData();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const previousMonthDate = new Date(currentYear, currentMonth - 2, 1);

  const [riskYear, setRiskYear] = useState(currentYear);
  const [riskMonth, setRiskMonth] = useState(currentMonth);
  const [compareYearA, setCompareYearA] = useState(previousMonthDate.getFullYear());
  const [compareMonthA, setCompareMonthA] = useState(previousMonthDate.getMonth() + 1);
  const [compareYearB, setCompareYearB] = useState(currentYear);
  const [compareMonthB, setCompareMonthB] = useState(currentMonth);

  const availableYears = useMemo(() => {
    const years = rows
      .map((row) => extractYearMonth(row.ano_mes)?.year)
      .filter((year): year is number => Boolean(year));

    return Array.from(new Set([...years, currentYear, riskYear, compareYearA, compareYearB])).sort(
      (a, b) => b - a,
    );
  }, [compareYearA, compareYearB, currentYear, riskYear, rows]);

  const totalAllTime = useMemo(() => sum(rows, (row) => row.valor_glosado), [rows]);

  const totalCurrentYear = useMemo(
    () =>
      sum(
        rows.filter((row) => extractYearMonth(row.ano_mes)?.year === currentYear),
        (row) => row.valor_glosado,
      ),
    [currentYear, rows],
  );

  const totalCurrentMonth = useMemo(
    () =>
      sum(
        rows.filter((row) => {
          const parsed = extractYearMonth(row.ano_mes);
          return parsed?.year === currentYear && parsed.month === currentMonth;
        }),
        (row) => row.valor_glosado,
      ),
    [currentMonth, currentYear, rows],
  );

  const riskData = useMemo(() => {
    const key = toYearMonthKey(riskYear, riskMonth);
    const filtered = rows.filter((row) => row.ano_mes === key);
    const byResource = groupBy(filtered, (row) => row.recurso);

    return Object.entries(byResource)
      .map(([recurso, resourceRows]) => {
        const totalValor = sum(resourceRows, (row) => row.valor_glosado);
        // Escolha da V1: usar média do score para reduzir ruído de outliers no período.
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
  }, [riskMonth, riskYear, rows]);

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
    const byMotivo = groupBy(rows, (row) => row.motivo);

    const aggregated = Object.entries(byMotivo).map(([motivo, motivoRows]) => ({
      motivo,
      valor: sum(motivoRows, (row) => row.valor_glosado),
    }));

    return topN(aggregated, 7, (item) => item.valor);
  }, [rows]);

  const mosaicData = useMemo(() => {
    const byResource = groupBy(rows, (row) => row.recurso);
    const sortedResources = Object.entries(byResource)
      .map(([recurso, resourceRows]) => {
        const valor = sum(resourceRows, (row) => row.valor_glosado);
        const highRiskCount = resourceRows.filter((row) => row.flag_alto_risco === 1).length;
        const hasHigh = highRiskCount > 0;
        const hasMedium = resourceRows.some((row) => normalizeRiskBand(row.faixa_risco) === "Médio");
        const dominantRisk: RiskBand = hasHigh ? "Alto" : hasMedium ? "Médio" : "Baixo";

        return {
          recurso,
          valor,
          percentHighRisk: resourceRows.length ? (highRiskCount / resourceRows.length) * 100 : 0,
          dominantRisk,
        };
      })
      .sort((a, b) => b.valor - a.valor);

    const largeLimit = Math.max(1, Math.ceil(sortedResources.length * 0.2));
    const mediumLimit = Math.max(2, Math.ceil(sortedResources.length * 0.55));

    return sortedResources.map((item, index) => {
      let size: "large" | "medium" | "small" = "small";
      if (index < largeLimit) {
        size = "large";
      } else if (index < mediumLimit) {
        size = "medium";
      }

      return { ...item, size };
    });
  }, [rows]);

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
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : null}

        {loading ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            Carregando dados...
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Valor Total da Glosa" value={formatCurrencyBRL(totalAllTime)} subtitle="All-time" />
          <KpiCard
            title="Total Glosa (Ano)"
            value={formatCurrencyBRL(totalCurrentYear)}
            subtitle={String(currentYear)}
          />
          <KpiCard
            title="Total Glosa (Mês)"
            value={formatCurrencyBRL(totalCurrentMonth)}
            subtitle={`${formatMonthLabel(currentMonth)} / ${currentYear}`}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Risco de Glosa</h2>
                <p className="text-sm text-slate-500">Média do score por recurso no período.</p>
              </div>
              <FilterMonthYear
                year={riskYear}
                month={riskMonth}
                years={availableYears}
                onYearChange={setRiskYear}
                onMonthChange={setRiskMonth}
              />
            </header>
            <RiskBarChart data={riskData} />
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Evolução - Valor Glosado</h2>
              <p className="text-sm text-slate-500">Somatório mensal em todo o histórico.</p>
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
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Ranking - Motivos de Glosa</h2>
              <p className="text-sm text-slate-500">Top 7 motivos por valor glosado.</p>
            </header>
            <MotivoRanking data={motivoRankingData} />
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Níveis de Recursos de Risco de Glosa</h2>
              <p className="text-sm text-slate-500">Mosaico proporcional aproximado ao valor glosado.</p>
            </header>
            <ResourceRiskMosaic data={mosaicData} />
          </article>
        </section>
      </div>
    </main>
  );
}