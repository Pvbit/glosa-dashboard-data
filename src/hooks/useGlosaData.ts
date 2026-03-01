"use client";

import { useEffect, useState } from "react";
import type { GlosaPayload, GlosaRow } from "@/types/glosa";

type UseGlosaDataResult = {
  loading: boolean;
  error: string | null;
  updated_at: string | null;
  rows: GlosaRow[];
};

export function useGlosaData(): UseGlosaDataResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<GlosaPayload | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/public-data/latest.json");
        if (!response.ok) {
          throw new Error("Falha ao carregar o snapshot.");
        }

        const json = (await response.json()) as GlosaPayload;
        if (active) {
          setPayload(json);
        }
      } catch {
        if (active) {
          setError("Nao foi possivel carregar os dados do dashboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  return {
    loading,
    error,
    updated_at: payload?.updated_at ?? null,
    rows: payload?.rows ?? [],
  };
}
