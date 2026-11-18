import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiFetch, COOKIE, sessionId } from "@/lib/api/client";

export async function POST() {
  const sid = await sessionId();
  // Se a API estiver fora do ar, o cookie é apagado do mesmo jeito (a sessão expira sozinha por inatividade).
  if (sid) await apiFetch("/auth/logout", { method: "POST", sid }).catch(() => null);
  (await cookies()).delete(COOKIE);
  // Redirecionamento relativo (veja o comentário em api/login/route.ts).
  return new NextResponse(null, { status: 303, headers: { Location: "/" } });
}
