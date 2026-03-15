import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monitoramento de Glosas",
  description: "Dashboard de monitoramento de glosas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
