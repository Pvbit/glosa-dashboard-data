import { formatCurrencyBRL } from "@/lib/format";
import type { RiskBand } from "@/types/glosa";

type MosaicDatum = {
  recurso: string;
  valor: number;
  percentHighRisk: number;
  dominantRisk: RiskBand;
  size: "large" | "medium" | "small";
};

type ResourceRiskMosaicProps = {
  data: MosaicDatum[];
};

const colorByRisk: Record<RiskBand, string> = {
  Alto: "bg-red-100 text-red-900 border-red-200",
  Médio: "bg-amber-100 text-amber-900 border-amber-200",
  Baixo: "bg-emerald-100 text-emerald-900 border-emerald-200",
};

const sizeByLevel: Record<MosaicDatum["size"], string> = {
  large: "col-span-12 sm:col-span-8 lg:col-span-6 row-span-2",
  medium: "col-span-6 sm:col-span-4 lg:col-span-4 row-span-2",
  small: "col-span-6 sm:col-span-4 lg:col-span-3 row-span-1",
};

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function ResourceRiskMosaic({ data }: ResourceRiskMosaicProps) {
  if (!data.length) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
        Sem dados de recursos para o mosaico.
      </div>
    );
  }

  return (
    <div className="grid auto-rows-[88px] grid-cols-12 gap-3">
      {data.map((item) => (
        <article
          key={item.recurso}
          className={`rounded-lg border p-3 shadow-sm ${colorByRisk[item.dominantRisk]} ${sizeByLevel[item.size]}`}
          title={`${item.recurso}
Valor glosado: ${formatCurrencyBRL(item.valor)}
% alto risco: ${formatPercent(item.percentHighRisk)}`}
        >
          <p className="line-clamp-2 text-sm font-semibold">{item.recurso}</p>
          <p className="mt-1 text-xs">{formatCurrencyBRL(item.valor)}</p>
          <p className="text-xs">% alto risco: {formatPercent(item.percentHighRisk)}</p>
        </article>
      ))}
    </div>
  );
}

export type { MosaicDatum };
