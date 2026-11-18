import { NextResponse } from "next/server";
import { ApiError, apiFetch, sessionId } from "@/lib/api/client";

export const dynamic = "force-dynamic";

/** Detalhe de story/task para o modal: repassa para a API (que valida os parâmetros e o acesso ao projeto). */
export async function GET(req: Request) {
  const sid = await sessionId();
  if (!sid) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const qs = new URLSearchParams({ kind: q.get("kind") ?? "", id: q.get("id") ?? "", project: q.get("project") ?? "" });
  try {
    const res = await apiFetch(`/items?${qs}`, { sid });
    if (res.ok) return NextResponse.json(await res.json());
    const code = ((await res.json().catch(() => ({}))) as { error?: string }).error;
    const status = [400, 401, 403, 404].includes(res.status) ? res.status : 502;
    const msg: Record<number, string> = { 400: "Parâmetros inválidos", 401: "Sem sessão", 403: "Acesso restrito", 404: "Não encontrado", 502: "Falha ao consultar o Taiga" };
    return NextResponse.json({ error: msg[status], code }, { status });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: "Falha ao consultar o Taiga" }, { status: 502 });
    throw e;
  }
}
