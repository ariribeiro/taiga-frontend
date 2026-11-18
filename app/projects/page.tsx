import { redirect } from "next/navigation";
import { getMe, getProjects } from "@/lib/api/client";
import { renderApiError } from "@/components/layout/api-error";
import { Header } from "@/components/layout/header";
import { ProjectList } from "@/components/projects/project-list";

export const dynamic = "force-dynamic";

export default async function Projects() {
  const me = await getMe();
  if (!me) redirect("/");
  let projects;
  try {
    projects = await getProjects(true);
  } catch (e) {
    return renderApiError(e, me.fullName);
  }
  return (
    <>
      <Header name={me.fullName} />
      <main className="wrap">
        <div className="page-title"><h2>Seus projetos</h2><span className="muted">{projects.length} projeto(s)</span></div>
        <ProjectList userId={me.userId}
          projects={projects.map((p) => ({ id: p.id, name: p.name, description: p.description ?? "", logo: p.logo_small_url ?? null }))} />
      </main>
    </>
  );
}
