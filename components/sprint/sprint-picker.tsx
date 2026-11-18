"use client";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

/** Troca de sprint assim que o usuário escolhe uma opção (sem botão). */
export function SprintPicker({ sprints, current }: { sprints: { id: number; name: string; closed: boolean }[]; current: number }) {
  const router = useRouter();
  const path = usePathname();
  const [pending, start] = useTransition();
  return (
    <form method="get" className={`picker${pending ? " loading" : ""}`}>
      <select
        name="sprint"
        value={current}
        disabled={pending}
        aria-label="Sprint"
        onChange={(e) => start(() => router.push(`${path}?sprint=${e.target.value}`))}
      >
        {sprints.map((m) => <option key={m.id} value={m.id}>{m.name}{m.closed ? " (fechada)" : ""}</option>)}
      </select>
      {pending && <span className="spin" aria-label="Carregando" />}
      {/* sem JavaScript, o formulário ainda funciona com Enter/botão oculto */}
      <noscript><button type="submit">Ver</button></noscript>
    </form>
  );
}
