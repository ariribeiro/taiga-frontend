import { Sk, SkDevGrid, SkHeader, SkKpis, SkOverview, SkPageTitle, SkWrap } from "@/components/ui/skeleton";

/** Esqueleto da página do projeto (serve à sprint Scrum e ao quadro Kanban, que têm o mesmo "esqueleto" geral). */
export default function Loading() {
  return (
    <>
      <SkHeader />
      <SkWrap as="main" className="wrap" label="Carregando projeto…">
        <Sk w={80} h={13} />
        <SkPageTitle avatar={44} />
        <SkOverview />
        <SkKpis />
        <section className="card"><Sk w={140} h={11} /><div style={{ height: 14 }} /><Sk w="100%" h={14} r={99} /></section>
        <div className="page-title"><Sk w={190} h={20} /></div>
        <SkDevGrid />
      </SkWrap>
    </>
  );
}
