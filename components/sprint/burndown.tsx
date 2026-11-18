import type { TStatsDay } from "@/lib/api/types";

const W = 760, H = 280, L = 44, R = 16, T = 16, B = 34;
const dm = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Burndown em SVG puro: linha ideal (tracejada) x pontos em aberto reais. */
export function Burndown({ days }: { days: TStatsDay[] }) {
  if (!days.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const max = Math.max(1, ...days.flatMap((d) => [d.open_points ?? 0, d.optimal_points ?? 0]));
  const top = Math.ceil(max / 4) * 4 || 4;
  const x = (i: number) => L + (days.length === 1 ? 0 : (i / (days.length - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / top) * (H - T - B);

  const ideal = days.map((d, i) => d.optimal_points != null ? [x(i), y(d.optimal_points)] : null).filter(Boolean) as number[][];
  const real = days.map((d, i) => d.day <= today && d.open_points != null ? [x(i), y(d.open_points), i] : null).filter(Boolean) as number[][];
  const pts = (a: number[][]) => a.map((p) => `${p[0]},${p[1]}`).join(" ");
  const area = real.length > 1 ? `${pts(real)} ${real[real.length - 1][0]},${y(0)} ${real[0][0]},${y(0)}` : "";
  const ticks = [0, 1, 2, 3, 4].map((k) => (top / 4) * k);
  const labelIdx = [...new Set([0, Math.floor((days.length - 1) / 2), days.length - 1])];
  const ti = days.findIndex((d) => d.day === today);

  // situação de hoje: último dia com dado real <= hoje
  const lastReal = [...days].reverse().find((d) => d.day <= today && d.open_points != null);
  const diff = lastReal && lastReal.optimal_points != null ? r1((lastReal.open_points as number) - lastReal.optimal_points) : null;

  return (
    <section className="card">
      <details className="fold" open>
      <summary className="row">
        <h4 className="sec" style={{ margin: 0 }}><span className="chev" aria-hidden="true">▸</span> Burndown da sprint</h4>
        {lastReal && (
          <span className="muted">
            Restam <b>{r1(lastReal.open_points as number)}</b> pts
            {diff != null && <> · ideal {r1(lastReal.optimal_points as number)} · <span className={diff > 0.5 ? "err" : "ok-txt"}>{diff > 0.5 ? `${diff} pts acima do ideal` : diff < -0.5 ? `${Math.abs(diff)} pts à frente` : "no ideal"}</span></>}
          </span>
        )}
      </summary>
      <svg viewBox={`0 0 ${W} ${H}`} className="bd" role="img" aria-label="Gráfico de burndown da sprint">
        <defs><linearGradient id="bdg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity=".25" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
        {ticks.map((t) => (<g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="bd-grid" /><text x={L - 8} y={y(t) + 4} textAnchor="end" className="bd-t">{r1(t)}</text></g>))}
        {labelIdx.map((i) => <text key={i} x={x(i)} y={H - 10} textAnchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"} className="bd-t">{dm(days[i].day)}</text>)}
        {ti >= 0 && <line x1={x(ti)} x2={x(ti)} y1={T} y2={H - B} className="bd-today" />}
        {area && <polygon points={area} fill="url(#bdg)" />}
        {ideal.length > 1 && <polyline points={pts(ideal)} className="bd-ideal" fill="none" />}
        {real.length > 1 && <polyline points={pts(real)} className="bd-real" fill="none" />}
        {real.map((p) => (<circle key={p[2]} cx={p[0]} cy={p[1]} r="3.5" className="bd-dot"><title>{`${dm(days[p[2]].day)}: ${r1(days[p[2]].open_points as number)} pts em aberto (ideal ${r1(days[p[2]].optimal_points ?? 0)})`}</title></circle>))}
      </svg>
      <div className="legend"><span><i style={{ background: "var(--accent)" }} />Pontos em aberto</span><span><i className="dash" />Ideal</span>{ti >= 0 && <span><i style={{ background: "var(--fg)", opacity: .5, width: 2, height: 10, borderRadius: 0 }} />Hoje</span>}</div>
      </details>
    </section>
  );
}
