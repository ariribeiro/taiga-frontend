import type { ReactNode } from "react";

import { Picture } from "@/components/ui/picture";

export const Avatar = ({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) => (
  <Picture name={name} src={src} size={size} />
);

export function Ring({ value, size = 96, stroke = 10, label, title }: { value: number; size?: number; stroke?: number; label?: string; title?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.min(Math.max(value, 0), 100);
  return (
    <div className="ring" style={{ width: size, height: size }} title={title}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${v}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-fg" strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-txt"><b style={{ fontSize: size < 70 ? size * 0.21 : size * 0.26 }}>{v}%</b>{label && <small>{label}</small>}</div>
    </div>
  );
}

export const Bar = ({ value, marker }: { value: number; marker?: number | null }) => (
  <div className="bar">
    <div className="fill" style={{ width: `${value}%` }} />
    {marker != null && <div className="mark" style={{ left: `${marker}%` }} title={`Esperado pelo calendário: ${marker}%`} />}
  </div>
);

export const Chip = ({ name, color }: { name: string; color: string }) => (
  <span className="chip" style={{ ["--c" as string]: color }}><i />{name}</span>
);

export const Kpi = ({ value, label, icon }: { value: ReactNode; label: string; icon: string }) => (
  <div className="kpi"><span className="kpi-ico">{icon}</span><div><b>{value}</b><span>{label}</span></div></div>
);

export const Logo = () => (
  <span className="logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg></span>
);

/** Link “↗” para abrir a story/task no Taiga (não aparece se TAIGA_WEB_URL não estiver configurada). */
export const ExtLink = ({ href, what = "item" }: { href: string | null | undefined; what?: string }) =>
  href ? <a className="ext" href={href} target="_blank" rel="noopener noreferrer" title="Abrir no Taiga" aria-label={`Abrir ${what} no Taiga`}>↗</a> : null;
