import { Sk, SkLines, SkWrap } from "@/components/ui/skeleton";

/** Esqueleto do modal de detalhes (mesma estrutura de cabeçalho + coluna principal + lateral). */
export function ItemSkeleton() {
  return (
    <SkWrap label="Carregando detalhes…">
      <header className="m-head">
        <div className="m-title" style={{ flex: 1 }}><Sk w={140} h={12} /><div style={{ height: 10 }} /><Sk w="70%" h={22} /></div>
        <div className="m-actions"><Sk w={120} h={30} r={10} /><Sk w={34} h={30} r={10} /></div>
      </header>
      <div className="m-grid">
        <div className="m-main">
          <div className="modal-badges" style={{ marginTop: 16 }}><Sk w={90} h={22} r={99} /><Sk w={64} h={22} r={99} /></div>
          <div style={{ height: 22 }} /><Sk w={80} h={10} /><div style={{ height: 12 }} />
          <SkLines n={6} h={13} />
        </div>
        <div className="m-side"><SkLines n={4} h={14} last="45%" /><div style={{ height: 24 }} /><SkLines n={3} h={14} last="70%" /></div>
      </div>
    </SkWrap>
  );
}
