"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Picture } from "@/components/ui/picture";
import { useFavorites } from "@/components/projects/use-favorites";

type P = { id: number; name: string; description: string; logo: string | null };

function Card({ p, fav, onToggle, pid }: { p: P; fav: boolean; onToggle: () => void; pid: number }) {
  return (
    <div className={`card pcard${fav ? " fav" : ""}`}>
      <Link href={`/projects/${pid}`} className="proj-link">
        <Picture name={p.name} src={p.logo} size={46} square />
        <strong>{p.name}</strong>
        <span className="muted">{p.description.slice(0, 110) || "Sem descrição"}</span>
        <span className="proj-go">Ver sprint →</span>
      </Link>
      <button type="button" className={`star${fav ? " on" : ""}`} onClick={onToggle} aria-pressed={fav}
        aria-label={fav ? `Remover ${p.name} dos favoritos` : `Marcar ${p.name} como favorito`} title={fav ? "Remover dos favoritos" : "Marcar como favorito"}>
        {fav ? "★" : "☆"}
      </button>
    </div>
  );
}

/** Lista de projetos com estrela de favorito; favoritos primeiro. */
export function ProjectList({ projects, userId }: { projects: P[]; userId: number }) {
  const { favs, ready, toggle } = useFavorites(userId);

  const { top, rest } = useMemo(() => ({
    top: projects.filter((p) => favs.includes(p.id)),
    rest: projects.filter((p) => !favs.includes(p.id)),
  }), [projects, favs]);

  if (!projects.length) return <p className="muted">Você não tem o papel “Servidor Dirti/Fiscal” em nenhum projeto.</p>;
  return (
    // escondido até ler os favoritos, para a lista não "pular" de ordem na tela
    <div className={`pl${ready ? " ready" : ""}`}>
      <noscript><style>{".pl{visibility:visible!important}"}</style></noscript>
      {top.length > 0 && (<>
        <h4 className="sec fav-h"><span className="fav-star" aria-hidden="true">★</span> Favoritos <span className="count">{top.length}</span></h4>
        <div className="grid">{top.map((p) => <Card key={p.id} p={p} pid={p.id} fav onToggle={() => toggle(p.id)} />)}</div>
        {rest.length > 0 && <h4 className="sec fav-h">Outros projetos <span className="count">{rest.length}</span></h4>}
      </>)}
      <div className="grid">{rest.map((p) => <Card key={p.id} p={p} pid={p.id} fav={false} onToggle={() => toggle(p.id)} />)}</div>
    </div>
  );
}
