const W = 760, H = 220, L = 36, R = 12, T = 22, B = 30;

/** Barras de vazão semanal (itens concluídos por semana), em SVG puro. */
export function ThroughputChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const top = Math.max(4, Math.ceil(max / 4) * 4);
  const bw = (W - L - R) / data.length;
  const y = (v: number) => T + (1 - v / top) * (H - T - B);
  const avg = data.reduce((n, d) => n + d.count, 0) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="bd" role="img" aria-label="Itens concluídos por semana">
      {[0, 1, 2, 3, 4].map((k) => { const v = (top / 4) * k; return (
        <g key={k}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="bd-grid" /><text x={L - 8} y={y(v) + 4} textAnchor="end" className="bd-t">{v}</text></g>); })}
      {data.map((d, i) => {
        const x = L + i * bw + bw * 0.18, w = bw * 0.64;
        return (
          <g key={i}>
            <rect x={x} y={y(d.count)} width={w} height={Math.max(0, y(0) - y(d.count))} rx="5" className="kbar"><title>{`Semana de ${d.label}: ${d.count} concluído(s)`}</title></rect>
            {d.count > 0 && <text x={x + w / 2} y={y(d.count) - 6} textAnchor="middle" className="bd-t kbar-n">{d.count}</text>}
            <text x={x + w / 2} y={H - 10} textAnchor="middle" className="bd-t">{d.label}</text>
          </g>
        );
      })}
      <line x1={L} x2={W - R} y1={y(avg)} y2={y(avg)} className="bd-today" />
    </svg>
  );
}
