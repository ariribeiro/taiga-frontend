"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ItemButton } from "@/components/items/item-modal";
import { ExtLink } from "@/components/ui/primitives";

type Row = { id: number; ref: number; subject: string; status: string; color: string; closed: boolean; points?: number; storyRef?: number | null; href: string | null };

function List({ title, kind, rows, project }: { title: string; kind: "us" | "task"; rows: Row[]; project: number }) {
  if (!rows.length) return null;
  return (
    <section>
      <h4 className="sec">{title} <span className="count">{rows.length}</span></h4>
      <ul className="items">
        {rows.map((r) => (
          <li key={r.id} className={r.closed ? "done" : ""}>
            <span className="ref">#{r.ref}</span>
            <span className="subj"><ItemButton kind={kind} id={r.id} project={project} href={r.href}>{r.subject}</ItemButton> <ExtLink href={r.href} what={`${kind === "us" ? "story" : "task"} #${r.ref}`} /></span>
            <span className="chip" style={{ ["--c" as string]: r.color }}><i />{r.status}</span>
            <span className="meta">{kind === "us" ? `${r.points ?? 0} pts` : r.storyRef ? `story #${r.storyRef}` : ""}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Dialog({ stories, tasks, project, sprint, onClose }: { stories: Row[]; tasks: Row[]; project: number; sprint: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} className="modal sm" onClose={(e) => { if (e.target === e.currentTarget) onClose(); }} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
      <div className="modal-in">
        <header className="m-head">
          <div className="m-title"><p className="muted">{sprint}</p><h3 className="modal-t">Itens sem responsável</h3></div>
          <div className="m-actions"><button className="modal-x ghost" onClick={() => ref.current?.close()} aria-label="Fechar">✕</button></div>
        </header>
        <div className="m-body">
          <List title="User stories" kind="us" rows={stories} project={project} />
          <List title="Tasks" kind="task" rows={tasks} project={project} />
        </div>
      </div>
    </dialog>
  );
}

/** Card de indicador que abre um modal com os itens da sprint que ninguém assumiu. */
export function UnassignedKpi({ stories, tasks, project, sprint }: { stories: Row[]; tasks: Row[]; project: number; sprint: string }) {
  const [open, setOpen] = useState(false);
  const total = stories.length + tasks.length;
  const inner = (
    <>
      <span className="kpi-ico">!</span>
      <div><b>{total}</b><span>sem responsável</span>{total > 0 && <span className="kpi-sub">{stories.length} stories · {tasks.length} tasks</span>}</div>
    </>
  );
  if (!total) return <div className="kpi">{inner}</div>;
  return (
    <>
      <button type="button" className="kpi kpi-btn" onClick={() => setOpen(true)} title="Ver itens sem responsável">{inner}</button>
      {open && createPortal(<Dialog stories={stories} tasks={tasks} project={project} sprint={sprint} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
