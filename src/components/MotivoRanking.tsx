import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrencyBRL } from "@/lib/format";

type MotivoDatum = {
  motivo: string;
  valor: number;
};

type MotivoRankingProps = {
  data: MotivoDatum[];
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: MotivoDatum }>;
};

function RankingTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="max-w-xs rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <p className="font-semibold text-slate-900">{item.motivo}</p>
      <p className="text-slate-600">{formatCurrencyBRL(item.valor)}</p>
    </div>
  );
}

export function MotivoRanking({ data }: MotivoRankingProps) {
  if (!data.length) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
        Sem motivos para exibir no ranking.
      </div>
    );
  }

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(value) => formatCurrencyBRL(value)} />
          <YAxis
            type="category"
            dataKey="motivo"
            width={180}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(value: string) => (value.length > 35 ? `${value.slice(0, 35)}...` : value)}
          />
          <Tooltip content={<RankingTooltip />} />
          <Bar dataKey="valor" fill="#0284c7" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type { MotivoDatum };
