import type { RiskBand } from "@/types/glosa";

export function groupBy<T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K,
): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = getKey(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

export function sum<T>(items: T[], getValue: (item: T) => number): number {
  return items.reduce((acc, item) => acc + getValue(item), 0);
}

export function topN<T>(items: T[], n: number, getValue: (item: T) => number): T[] {
  return [...items].sort((a, b) => getValue(b) - getValue(a)).slice(0, n);
}

export function monthKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function normalizeRiskBand(rawValue: string): RiskBand {
  const value = rawValue.trim().toLowerCase();

  if (value.includes("alto")) {
    return "Alto";
  }

  // Inclui casos com texto mal-encodado, como "MÃ©dio".
  if (
    value.includes("médio") ||
    value.includes("medio") ||
    value.includes("mã©dio") ||
    value.includes("med")
  ) {
    return "Médio";
  }

  return "Baixo";
}
