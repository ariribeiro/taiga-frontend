"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { ItemDetail } from "@/lib/api/types";
import { Picture } from "@/components/ui/picture";
import { Md } from "@/components/ui/markdown";
import { Lightbox } from "@/components/ui/lightbox";
import { ExtLink } from "@/components/ui/primitives";
import { ItemSkeleton } from "@/components/items/item-skeleton";

// Nomes vindos TODO EM MAIÚSCULAS ficam em formato de nome próprio.
const pretty = (n: string) => (n && n === n.toUpperCase() ? n.toLowerCase().replace(/(^|\s)(\S)/g, (_, a, b) => a + b.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g, (m) => m.toLowerCase()) : n);
const first = (n: string) => pretty(n).split(" ")[0];

const size = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : n ? `${n} B` : "");

/** Miniatura de anexo; se não carregar, vira um link com o nome do arquivo. */
function Thumb({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  // eslint-disable-next-line @next/next/no-img-element
  return failed ? <span className="thumb-fail">🖼 {name}</span> : <img src={src} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}

const TTL = 3 * 60_000; // links de anexo podem ter token com validade curta
const cache = new Map<string, { at: number; d: ItemDetail }>();
const fresh = (k: string) => { const h = cache.get(k); return h && Date.now() - h.at < TTL ? h.d : null; };
const dt = (d: string | null) => (d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const day = (d: string | null) => (d ? new Date(d.slice(0, 10) + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—");

function Dialog({ kind, id, project, href, onClose }: { kind: "us" | "task"; id: number; project: number; href: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const key = `${kind}:${id}`;
  const [data, setData] = useState<ItemDetail | null>(fresh(key));
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { ref.current?.showModal(); }, []);
  useEffect(() => {
    if (fresh(key)) return;
    const ac = new AbortController();
    fetch(`/api/item?kind=${kind}&id=${id}&project=${project}`, { signal: ac.signal })
      .then(async (r) => {
        if (r.status === 401) { window.location.href = "/"; return; }
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Erro");
        cache.set(key, { at: Date.now(), d: j }); setData(j);
      })
      .catch((e) => { if (e.name !== "AbortError") setErr(e.message || "Erro ao carregar"); });
    return () => ac.abort();
  }, [key, kind, id, project]);

  return (
    <dialog ref={ref} className="modal" onClose={(e) => { if (e.target === e.currentTarget) onClose(); }} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
      <div className="modal-in">
        {err ? <div className="m-pad"><p className="err">{err}</p><button className="ghost" onClick={() => ref.current?.close()}>Fechar</button></div>
          : !data ? <ItemSkeleton />
          : <Body d={data} href={href} onClose={() => ref.current?.close()} />}
      </div>
    </dialog>
  );
}

function Body({ d, href, onClose }: { d: ItemDetail; href: string | null; onClose: () => void }) {
  const [lb, setLb] = useState<number | null>(null);
  const imgs = d.attachments.filter((a) => a.isImage);
  const done = d.children.filter((t) => t.closed).length;
  return (
    <>
      <header className="m-head">
        <div className="m-title">
          <p className="muted">{d.kind === "us" ? "User story" : "Task"} #{d.ref}{d.parent && <> · story #{d.parent.ref} — {d.parent.subject} <ExtLink href={d.parent.webUrl} what={`story #${d.parent.ref}`} /></>}</p>
          <h3 className="modal-t">{d.subject}</h3>
        </div>
        <div className="m-actions">
          {(d.webUrl ?? href) && <a className="btn-link" href={(d.webUrl ?? href) as string} target="_blank" rel="noopener noreferrer">Abrir no Taiga ↗</a>}
          <button className="modal-x ghost" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
      </header>

      <div className="m-grid">
        <div className="m-main">
          <div className="modal-badges">
            {d.status && <span className="chip" style={{ ["--c" as string]: d.status.color }}><i />{d.status.name}</span>}
            {d.blocked && <span className="chip" style={{ ["--c" as string]: "#e5484d" }}><i />Bloqueado</span>}
            {d.tags.map((t) => <span key={t.name} className="tag" style={t.color ? { ["--c" as string]: t.color } : undefined}>{t.name}</span>)}
          </div>
          {d.blocked && <p className="alert">Motivo do bloqueio: {d.blocked}</p>}

          <h4 className="sec">Descrição</h4>
          {d.description.trim() ? <Md text={d.description} base={d.baseUrl} /> : <p className="muted">Sem descrição.</p>}

          {d.attachments.length > 0 && (<>
            <h4 className="sec">Anexos <span className="count">{d.attachments.length}</span></h4>
            {imgs.length > 0 && (
              <div className="gallery">{imgs.map((a, k) => (
                <button key={a.id} type="button" className="gthumb" onClick={() => setLb(k)} title={a.name} aria-label={`Ver ${a.name}`}>
                  <Thumb src={a.url} name={a.name} />
                </button>))}</div>
            )}
            <ul className="files">{d.attachments.filter((a) => !a.isImage).map((a) => (
              <li key={a.id}><span aria-hidden="true">📎</span><a href={a.url} target="_blank" rel="noopener noreferrer">{a.name}</a><span className="muted">{size(a.size)}</span></li>))}</ul>
          </>)}

          {d.comments.length > 0 && (<>
            <h4 className="sec">Comentários <span className="count">{d.comments.length}</span></h4>
            <ul className="cmts">{d.comments.map((c, i) => (
              <li key={i}><Picture name={pretty(c.user)} src={c.photo} size={30} />
                <div><b>{pretty(c.user)}</b> <span className="muted">{dt(c.date)}</span><Md text={c.text} base={d.baseUrl} /></div></li>))}</ul>
          </>)}
        </div>

        <aside className="m-side">
          <h4 className="sec">Detalhes</h4>
          <dl className="kv">
            <div><dt>Responsável</dt><dd>{d.assignees.length
              ? d.assignees.map((a) => <span key={a.name} className="who-i"><Picture name={pretty(a.name)} src={a.photo} size={22} />{pretty(a.name)}</span>)
              : <span className="muted">Sem responsável</span>}</dd></div>
            {d.points != null && <div><dt>Pontos</dt><dd>{d.points}</dd></div>}
            {d.dueDate && <div><dt>Prazo</dt><dd>{day(d.dueDate)}</dd></div>}
            {d.owner && <div><dt>Criado por</dt><dd>{pretty(d.owner.name)}</dd></div>}
            <div><dt>Criado em</dt><dd>{dt(d.created)}</dd></div>
            <div><dt>Atualizado em</dt><dd>{dt(d.modified)}</dd></div>
            {d.finished && <div><dt>Concluído em</dt><dd>{dt(d.finished)}</dd></div>}
          </dl>

          {d.children.length > 0 && (<>
            <h4 className="sec">Tasks <span className="count">{done}/{d.children.length}</span></h4>
            <div className="mini-bar"><span style={{ width: `${(done / d.children.length) * 100}%` }} /></div>
            <ul className="trows">{d.children.map((t) => (
              <li key={t.ref} className={t.closed ? "done" : ""}>
                <span className="tick" aria-hidden="true">{t.closed ? "✓" : ""}</span>
                <div className="tbody">
                  <span className="tsubj"><span className="ref">#{t.ref}</span> {t.subject} <ExtLink href={t.webUrl} what={`task #${t.ref}`} /></span>
                  <span className="tmeta">
                    <span className="chip" style={{ ["--c" as string]: t.color }}><i />{t.status}</span>
                    {t.assignee && <span className="who-i" title={pretty(t.assignee)}><Picture name={pretty(t.assignee)} src={t.assigneePhoto} size={18} />{first(t.assignee)}</span>}
                  </span>
                </div>
              </li>))}</ul>
          </>)}
        </aside>
      </div>
      {lb !== null && <Lightbox images={imgs.map((a) => ({ src: a.url, name: a.name }))} start={lb} onClose={() => setLb(null)} />}
    </>
  );
}

/** Texto clicável que abre o modal com os detalhes da story/task. */
export function ItemButton({ kind, id, project, href, children }: { kind: "us" | "task"; id: number; project: number; href: string | null; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="linkbtn" onClick={() => setOpen(true)}>{children}</button>
      {/* no body: o modal não herda o estilo da lista onde o botão está */}
      {open && createPortal(<Dialog kind={kind} id={id} project={project} href={href} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
