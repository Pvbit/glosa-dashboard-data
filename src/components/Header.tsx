type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 pb-4">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
    </header>
  );
}
