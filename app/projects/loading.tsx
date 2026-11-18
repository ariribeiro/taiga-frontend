import { Sk, SkHeader, SkLines, SkWrap } from "@/components/ui/skeleton";

/** Esqueleto da lista de projetos. */
export default function Loading() {
  return (
    <>
      <SkHeader />
      <SkWrap as="main" className="wrap" label="Carregando projetos…">
        <div className="page-title"><Sk w={200} h={28} /><Sk w={90} h={14} /></div>
        <div className="grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card" style={{ padding: 20, display: "grid", gap: 12 }}>
              <Sk w={46} h={46} r={10} /><Sk w="65%" h={16} /><SkLines n={2} /><Sk w={80} h={12} />
            </div>
          ))}
        </div>
      </SkWrap>
    </>
  );
}
