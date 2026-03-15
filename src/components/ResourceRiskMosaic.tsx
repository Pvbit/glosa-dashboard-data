import { formatCurrencyBRL } from "@/lib/format";
import type { RiskBand } from "@/types/glosa";

type MosaicSize = "large" | "medium" | "small";

type MosaicDatum = {
  recurso?: string | null;
  valor?: number | null;
  percentHighRisk?: number | null;
  percentualAltoRisco?: number | null;
  dominantRisk?: RiskBand | null;
  risco?: RiskBand | null;
  size?: MosaicSize | null;
};

type ResourceRiskMosaicProps = {
  data?: MosaicDatum[] | null;
};

const colorByRisk: Record<RiskBand, string> = {
  Alto: "bg-red-100 text-red-900 border-red-200",
  Médio: "bg-amber-100 text-amber-900 border-amber-200",
  Baixo: "bg-emerald-100 text-emerald-900 border-emerald-200",
};

const sizeByLevel: Record<MosaicSize, string> = {
  large: "col-span-12 sm:col-span-8 lg:col-span-6 row-span-2",
  medium: "col-span-6 sm:col-span-4 lg:col-span-4 row-span-2",
  small: "col-span-6 sm:col-span-4 lg:col-span-3 row-span-1",
};

function toSafeNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatPercent(value: number | null | undefined): string {
  return `${toSafeNumber(value).toFixed(1)}%`;
}

export function ResourceRiskMosaic({ data }: ResourceRiskMosaicProps) {
  if (!data?.length) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
        Sem dados de recursos para o mosaico.
      </div>
    );
  }

  return (
    <div className="grid auto-rows-[88px] grid-cols-12 gap-3">
      {data.map((item, index) => {
        const recurso = item.recurso ?? "Sem recurso";
        const valor = toSafeNumber(item.valor);
        const percentHighRisk = item.percentHighRisk ?? item.percentualAltoRisco ?? 0;
        const dominantRisk = item.dominantRisk ?? item.risco ?? "Baixo";
        const size = item.size ?? "small";

        return (
          <article
            key={`${recurso}-${index}`}
            className={`rounded-lg border p-3 shadow-sm ${colorByRisk[dominantRisk]} ${sizeByLevel[size]}`}
            title={`${recurso}
Valor glosado: ${formatCurrencyBRL(valor)}
% alto risco: ${formatPercent(percentHighRisk)}`}
          >
            <p className="line-clamp-2 text-sm font-semibold">{recurso}</p>
            <p className="mt-1 text-xs">{formatCurrencyBRL(valor)}</p>
            <p className="text-xs">% alto risco: {formatPercent(percentHighRisk)}</p>
          </article>
        );
      })}
    </div>
  );
}

export type { MosaicDatum };
