import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrencyBRL } from "@/lib/format";

type GlosaLineDatum = {
  anoMes: string;
  valor: number;
};

type GlosaLineChartProps = {
  data: GlosaLineDatum[];
};

type LineTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: GlosaLineDatum }>;
};

function LineTooltip({ active, payload }: LineTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <p className="font-semibold text-slate-900">{item.anoMes}</p>
      <p className="text-slate-600">{formatCurrencyBRL(item.valor)}</p>
    </div>
  );
}

export function GlosaLineChart({ data }: GlosaLineChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
        Sem dados para exibir a evolucao.
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="anoMes" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(value) => formatCurrencyBRL(value)} />
          <Tooltip content={<LineTooltip />} />
          <Line
            type="monotone"
            dataKey="valor"
            stroke="#0f766e"
            strokeWidth={3}
            dot={{ r: 4, fill: "#0f766e" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export type { GlosaLineDatum };
