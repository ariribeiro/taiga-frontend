import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/primitives";

/**
 * Peças dos "esqueletos" de carregamento (loading.tsx e modal). Só markup e CSS (.sk em globals.css): nada de
 * estado nem de dados, então servem tanto em componentes de servidor quanto de cliente.
 * As classes de estrutura têm prefixo `sk-` (e não reutilizam .kpis, .overview, .brand…) de propósito: assim
 * seletores da página real (e dos testes) nunca casam com o esqueleto enquanto os dois estão no DOM.
 */

/** Bloco cinza animado. `w`/`h` em px (número) ou CSS (string); `circle` para avatares. */
export function Sk({ w, h = 14, circle, r, style }: { w?: number | string; h?: number | string; circle?: boolean; r?: number; style?: CSSProperties }) {
  return <span className="sk" style={{ width: w, height: h, borderRadius: circle ? "50%" : r, ...style }} />;
}

/** Linhas de texto; a última é mais curta. */
export function SkLines({ n = 3, h = 12, last = "60%" }: { n?: number; h?: number; last?: string }) {
  return <span className="sk-lines">{Array.from({ length: n }, (_, i) => <Sk key={i} h={h} w={i === n - 1 && n > 1 ? last : "100%"} />)}</span>;
}

/**
 * Envolve um esqueleto: avisa leitores de tela (role=status) e esconde os blocos decorativos.
 * `as="main"` para esqueletos de página, que já substituem o <main> real.
 */
export function SkWrap({ children, label = "Carregando…", as: Tag = "div", className }: { children: ReactNode; label?: string; as?: "div" | "main"; className?: string }) {
  return (
    <Tag role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </Tag>
  );
}

/** Cabeçalho da aplicação: a marca é real (estática); seletor de projeto e usuário são placeholders. */
export function SkHeader() {
  return (
    <header className="top" aria-hidden="true">
      <div className="top-l">
        <Link href="/projects" className="sk-brand"><Logo /><strong>Visão por Dev</strong></Link>
        <Sk w={170} h={34} r={10} />
      </div>
      <div className="user"><Sk w={30} h={30} circle /><Sk w={90} h={14} /></div>
    </header>
  );
}

/** Faixa de indicadores (.kpis). */
export function SkKpis({ n = 4 }: { n?: number }) {
  return (
    <div className="sk-kpis">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="sk-kpi"><Sk w={40} h={40} r={12} /><div style={{ flex: 1 }}><Sk w={60} h={22} /><div style={{ height: 6 }} /><Sk w="80%" h={10} /></div></div>
      ))}
    </div>
  );
}

/** Cartão de resumo (anel de progresso + título + barra), como o da sprint e o do dev. */
export function SkOverview({ ring = 132 }: { ring?: number }) {
  return (
    <section className="card sk-overview">
      <Sk w={ring} h={ring} circle />
      <div className="ov-main"><Sk w="40%" h={22} /><div style={{ height: 10 }} /><Sk w="55%" h={12} /><div style={{ height: 18 }} /><Sk w="100%" h={10} r={99} /></div>
    </section>
  );
}

/** Grade de cartões de pessoas (.dev-grid). */
export function SkDevGrid({ n = 6 }: { n?: number }) {
  return (
    <div className="dev-grid">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card" style={{ margin: 0 }}>
          <div className="dc-top"><Sk w={46} h={46} circle /><span className="who"><Sk w="70%" h={14} /><div style={{ height: 6 }} /><Sk w="45%" h={11} /></span><Sk w={54} h={54} circle /></div>
          <div className="dc-stats">{[0, 1, 2].map((k) => <div key={k}><Sk w={36} h={16} /><div style={{ height: 6 }} /><Sk w={48} h={10} /></div>)}</div>
        </div>
      ))}
    </div>
  );
}

/** Título de página (título à esquerda, seletor à direita). */
export function SkPageTitle({ avatar }: { avatar?: number }) {
  return (
    <div className="page-title">
      <div className="dev-head">{avatar && <Sk w={avatar} h={avatar} r={avatar > 50 ? undefined : 10} circle={avatar > 50} />}<Sk w={220} h={28} /></div>
      <Sk w={160} h={38} r={10} />
    </div>
  );
}
