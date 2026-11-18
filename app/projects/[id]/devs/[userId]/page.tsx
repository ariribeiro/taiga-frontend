import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { apiGet, getMe } from "@/lib/api/client";
import { renderApiError } from "@/components/layout/api-error";
import type { SprintResponse } from "@/lib/api/types";
import { taigaWebLink } from "@/lib/utils/links";
import { ItemButton } from "@/components/items/item-modal";
import { Header } from "@/components/layout/header";
import { Avatar, Bar, Chip, ExtLink, Kpi, Ring } from "@/components/ui/primitives";
import { SprintPicker } from "@/components/sprint/sprint-picker";
import { fmtDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type Item = { id: number; ref: number; subject: string; status: string; color: string; closed: boolean; extra: string; blocked: string | null };

function groupByStatus(items: Item[]) {
  const m = new Map<string, { name: string; color: string; closed: boolean; items: Item[] }>();
  for (const it of items) {
    const g = m.get(it.status) ?? { name: it.status, color: it.color, closed: it.closed, items: [] };
    g.items.push(it); m.set(it.status, g);
  }
  // abertas primeiro, concluídas por último
  return [...m.values()].sort((a, b) => Number(a.closed) - Number(b.closed));
}

function Group({ title, items, kind, project, webLink }: { title: string; items: Item[]; kind: "us" | "task"; project: number; webLink: (kind: "us" | "task", ref: number) => string | null }) {
  if (!items.length) return null;
  return (
    <section className="card">
      <h4 className="sec">{title} <span className="count">{items.length}</span></h4>
      {groupByStatus(items).map((g) => (
        <div key={g.name} className="grp">
          <div className="grp-h"><Chip name={g.name} color={g.color} /><span className="muted">{g.items.length}</span></div>
          <ul className="items">
            {g.items.map((i) => (
              <li key={i.id} className={i.closed ? "done" : ""}>
                <span className="ref">#{i.ref}</span><span className="subj"><ItemButton kind={kind} id={i.id} project={project} href={webLink(kind, i.ref)}>{i.subject}</ItemButton> <ExtLink href={webLink(kind, i.ref)} what={`${kind === "us" ? "story" : "task"} #${i.ref}`} /></span>
                {i.blocked && !i.closed && !i.blocked.startsWith("Status:") && <span className="chip" style={{ ["--c" as string]: "#e5484d" }} title={i.blocked}><i />Bloqueada</span>}<span className="meta">{i.extra}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export default async function DevPage(props: { params: Promise<{ id: string; userId: string }>; searchParams: Promise<{ sprint?: string }> }) {
  const params = await props.params;             // Next 15+: params e searchParams são assíncronos
  const searchParams = await props.searchParams;
  const me = await getMe();
  if (!me) redirect("/");
  const pid = Number(params.id), uid = Number(params.userId);
  if (!Number.isInteger(pid) || !Number.isInteger(uid)) notFound();

  const shell = (children: React.ReactNode) => (<><Header name={me.fullName} /><main className="wrap">{children}</main></>);

  try {
    const data = await apiGet<SprintResponse>(`/projects/${pid}/sprint${searchParams.sprint ? `?${new URLSearchParams({ sprint: searchParams.sprint })}` : ""}`);   // a API confere o papel da pessoa no projeto (403)
    if (data.kind === "kanban") return shell(<><Link href={`/projects/${pid}`} className="back">← {data.project.name}</Link><p className="muted">Este projeto usa Kanban (sem sprints). Veja os itens de cada pessoa no quadro do projeto.</p></>);
    const { project, sorted, sprint } = data;
    if (!sprint) return shell(<p className="muted">Este projeto não tem sprints.</p>);
    const { meta } = data;
    const dev = data.devs.find((d) => d.userId === uid);
    const back = `/projects/${pid}?sprint=${sprint.id}`;
    if (!dev) return shell(<><Link href={back} className="back">← {project.name}</Link><p className="err">Pessoa não encontrada neste projeto.</p></>);

    const storiesOwned = dev.stories.filter((s) => s.role === "responsável");
    const storiesVia = dev.stories.filter((s) => s.role === "via task");
    const toItem = (x: { id: number; ref: number; subject: string; status: string; color: string; closed: boolean; blocked: string | null }, extra: string): Item => ({ id: x.id, ref: x.ref, subject: x.subject, status: x.status, color: x.color, closed: x.closed, blocked: x.blocked, extra });
    // Link para abrir no Taiga (precisa de TAIGA_WEB_URL = endereço do site do Taiga)
    const webLink = (kind: "us" | "task", ref: number) => taigaWebLink(meta.webBase, project.slug, kind, ref);
    const idle = !dev.stories.length && !dev.tasks.length;

    return shell(<>
      <Link href={back} className="back">← {project.name} · {sprint.name}</Link>
      <div className="page-title">
        <div className="dev-head">
          <Avatar name={dev.name} src={dev.photo} size={56} />
          <div><h2>{dev.name}</h2><span className="muted">{dev.role || "Time"} · {sprint.name} ({fmtDate(sprint.estimated_start)} → {fmtDate(sprint.estimated_finish)})</span></div>
        </div>
        <SprintPicker sprints={sorted} current={sprint.id} />
      </div>

      {idle ? <div className="card"><p className="muted">Sem atividade atribuída nesta sprint.</p></div> : (<>
        <section className="card overview">
          <Ring value={dev.progress} size={112} stroke={11} label="concluído" />
          <div className="ov-main">
            <h3>Situação na sprint</h3>
            <p className="muted">
              {dev.basis === "pontos" ? `${dev.closedPoints} de ${dev.points} pontos concluídos` : `${dev.tasksDone} de ${dev.tasks.length} tasks concluídas`}
              {dev.open > 0 ? ` · ${dev.open} item(ns) em aberto` : " · tudo concluído"}
              {` · % baseado em ${dev.basis}`}
            </p>
            <Bar value={dev.progress} />
          </div>
        </section>

        <div className="kpis">
          <Kpi icon="◎" value={<>{dev.closedPoints}<small>/{dev.points}</small></>} label="pontos" />
          <Kpi icon="▤" value={storiesOwned.length} label="stories responsável" />
          <Kpi icon="✓" value={<>{dev.tasksDone}<small>/{dev.tasks.length}</small></>} label="tasks" />
          <Kpi icon="…" value={dev.open} label="em aberto" />
        </div>

        <Group title="Tasks" items={dev.tasks.map((t) => toItem(t, t.storyRef ? `story #${t.storyRef}` : ""))} kind="task" project={pid} webLink={webLink} />
        <Group title="User stories (responsável)" items={storiesOwned.map((s) => toItem(s, `${s.points} pts`))} kind="us" project={pid} webLink={webLink} />
        <Group title="Stories em que atua via task" items={storiesVia.map((s) => toItem(s, ""))} kind="us" project={pid} webLink={webLink} />
      </>)}
    </>);
  } catch (e) {
    return renderApiError(e, me.fullName);
  }
}
