export type RiskBand = "Baixo" | "Médio" | "Alto";

export type GlosaRow = {
  data: string;
  ano_mes: string;
  contrato: string;
  area: string;
  tipo: string;
  recurso: string;
  motivo: string;
  qtde_dias_glosados: number;
  valor_glosado: number;
  score_risco_glosa: number;
  faixa_risco: string;
  flag_alto_risco: 0 | 1;
};

export type GlosaPayload = {
  updated_at: string;
  rows: GlosaRow[];
};
