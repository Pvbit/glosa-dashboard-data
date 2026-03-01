type DataStatusProps = {
  loading: boolean;
  error: string | null;
};

export function DataStatus({ loading, error }: DataStatusProps) {
  // Prioriza erro antes de qualquer conteúdo.
  if (error) {
    return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  }

  if (loading) {
    return <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-700">Carregando dados...</p>;
  }

  return null;
}
