import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrencyBRL } from "@/lib/format";
import type { RiskBand } from "@/types/glosa";

type RiskBarDatum = {
  recurso: string;
  score: number;
  valorTotal: number;
  riskBand: RiskBand;
};

type RiskBarChartProps = {
  data: RiskBarDatum[];
};

const COLORS: Record<RiskBand, string> = {
  Alto: "#ef4444",
  Médio: "#f59e0b",
  Baixo: "#22c55e",
};

type RiskTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: RiskBarDatum }>;
};

function RiskTooltip({ active, payload }: RiskTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <p className="font-semibold text-slate-900">{item.recurso}</p>
      <p className="text-slate-600">Score medio: {item.score.toFixed(1)}</p>
      <p className="text-slate-600">Valor glosado: {formatCurrencyBRL(item.valorTotal)}</p>
      <p className="text-slate-600">Faixa: {item.riskBand}</p>
    </div>
  );
}

export function RiskBarChart({ data }: RiskBarChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
        Sem dados para o periodo selecionado.
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 64 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="recurso"
            angle={-35}
            textAnchor="end"
            interval={0}
            height={72}
            tick={{ fill: "#64748b", fontSize: 11 }}
          />
          <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip content={<RiskTooltip />} />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.recurso} fill={COLORS[entry.riskBand]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type { RiskBarDatum };
