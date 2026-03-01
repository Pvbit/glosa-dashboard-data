const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", { month: "long" });

export const MONTHS_PT_BR = Array.from({ length: 12 }, (_, index) =>
  MONTH_FORMATTER.format(new Date(2026, index, 1)),
);

export function formatCurrencyBRL(value: number): string {
  if (!Number.isFinite(value)) {
    return CURRENCY_FORMATTER.format(0);
  }

  return CURRENCY_FORMATTER.format(value);
}

export function formatMonthLabel(month: number): string {
  if (month < 1 || month > 12) {
    return "";
  }

  return MONTHS_PT_BR[month - 1];
}
