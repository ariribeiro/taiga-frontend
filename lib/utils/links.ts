/**
 * Links para abrir stories/tasks no próprio Taiga. O endereço do site do Taiga (`webBase`) vem da API
 * (variável TAIGA_WEB_URL do back); vazio = links ocultos.
 */
export function taigaWebLink(webBase: string | null | undefined, slug: string | null | undefined, kind: "us" | "task", ref: number): string | null {
  return webBase && slug ? `${webBase}/project/${encodeURIComponent(slug)}/${kind}/${ref}` : null;
}
