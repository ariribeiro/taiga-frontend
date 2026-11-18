import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Farol · Visibilidade Ágil",
  description: "O andamento de cada pessoa do time, sprint a sprint, e o fluxo dos projetos Kanban.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
