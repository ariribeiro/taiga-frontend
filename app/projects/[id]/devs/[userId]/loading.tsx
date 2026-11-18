import { Sk, SkHeader, SkKpis, SkLines, SkOverview, SkPageTitle, SkWrap } from "@/components/ui/skeleton";

/** Esqueleto da página de uma pessoa na sprint. */
export default function Loading() {
  return (
    <>
      <SkHeader />
      <SkWrap as="main" className="wrap" label="Carregando…">
        <Sk w={170} h={13} />
        <SkPageTitle avatar={56} />
        <SkOverview ring={112} />
        <SkKpis />
        {[0, 1].map((g) => (
          <section key={g} className="card">
            <Sk w={120} h={11} /><div style={{ height: 16 }} />
            <Sk w={110} h={22} r={99} /><div style={{ height: 14 }} />
            <SkLines n={3} h={16} last="85%" />
          </section>
        ))}
      </SkWrap>
    </>
  );
}
