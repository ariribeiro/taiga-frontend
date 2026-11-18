"use client";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { PERIODS } from "@/lib/utils/periods";

/** Troca o período de análise (projetos Kanban) assim que o usuário escolhe, sem botão. */
export function PeriodPicker({ current }: { current: number }) {
  const router = useRouter();
  const path = usePathname();
  const [pending, start] = useTransition();
  return (
    <form method="get" className={`picker${pending ? " loading" : ""}`}>
      <select name="days" value={current} disabled={pending} aria-label="Período"
        onChange={(e) => start(() => router.push(`${path}?days=${e.target.value}`))}>
        {PERIODS.map((d) => <option key={d} value={d}>Últimos {d} dias ({d / 7} semanas)</option>)}
      </select>
      {pending && <span className="spin" aria-label="Carregando" />}
      <noscript><button type="submit">Ver</button></noscript>
    </form>
  );
}
