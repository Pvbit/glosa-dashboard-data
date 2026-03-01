type DataInfoProps = {
  updatedAt: string;
  totalRecords: number;
};

export function DataInfo({ updatedAt, totalRecords }: DataInfoProps) {
  return (
    <section className="space-y-2 rounded-md border border-slate-200 p-4">
      {/* Informacoes basicas para a primeira versao do dashboard */}
      <p className="text-sm text-slate-700">
        Atualizado em: <span className="font-semibold text-slate-900">{updatedAt}</span>
      </p>
      <p className="text-sm text-slate-700">
        Total de registros: <span className="font-semibold text-slate-900">{totalRecords}</span>
      </p>
    </section>
  );
}
