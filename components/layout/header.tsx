import Link from "next/link";
import { getMe, getProjects } from "@/lib/api/client";
import { Avatar, Logo } from "@/components/ui/primitives";
import { ProjectSwitcher } from "@/components/projects/project-switcher";

export async function Header({ name }: { name: string }) {
  const me = await getMe().catch(() => null);
  // Se a lista falhar, o cabeçalho continua funcionando, só sem o seletor.
  const projects = me ? await getProjects(false).catch(() => []) : [];
  return (
    <header className="top">
      <div className="top-l">
        <Link href="/projects" className="brand"><Logo /><strong>Visão por Dev</strong></Link>
        {projects.length > 0 && <ProjectSwitcher userId={me!.userId} projects={projects.map((p) => ({ id: p.id, name: p.name, logo: p.logo_small_url ?? null }))} />}
      </div>
      <form method="post" action="/api/logout" className="user">
        <Avatar name={name} src={me?.photo ?? null} size={30} />
        <span>{name}</span>
        <button className="ghost" type="submit">Sair</button>
      </form>
    </header>
  );
}
