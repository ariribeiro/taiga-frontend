import { NextResponse } from "next/server";
import { ApiError, apiFetch, COOKIE, sessionId } from "@/lib/api/client";
import { clientIp } from "@/lib/api/client-ip";
import { cookies } from "next/headers";

// Erros da API que a tela de login sabe explicar (o resto vira "REDE").
const KNOWN = new Set(["CONFIG", "REDE", "CERT", "SERVICE_AUTH"]);

export async function POST(req: Request) {
  const form = await req.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  // Redirecionamento RELATIVO: o navegador resolve na origem em que já está (localhost, 127.0.0.1, IP, proxy HTTPS).
  const back = (q: string) => new NextResponse(null, { status: 303, headers: { Location: q } });
  if (!username || !password) return back("/?erro=1");

  let res: Response;
  try {
    res = await apiFetch("/auth/login", {
      method: "POST",
      body: { username, password },
      sid: await sessionId(),                                   // um novo login encerra a sessão anterior deste navegador
      headers: { "x-forwarded-for": clientIp(req.headers) },    // IP real, para o freio de força bruta da API
    });
  } catch (e) {
    if (e instanceof ApiError) return back("/?erro=API");
    throw e;
  }

  const body = (await res.json().catch(() => ({}))) as { sid?: string; maxAge?: number; error?: string; retryAfterMinutes?: number };
  if (res.ok && body.sid) {
    (await cookies()).set(COOKIE, body.sid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: body.maxAge ?? 12 * 3600,
    });
    return back("/projects");
  }
  if (res.status === 429) return back(`/?erro=LIMITE&m=${Math.max(1, Math.trunc(Number(body.retryAfterMinutes)) || 1)}`);
  if (res.status === 401 && body.error === "CRED") return back("/?erro=CRED");
  if (res.status === 400) return back("/?erro=1");
  if (res.status === 401) return back("/?erro=API");        // chave interna errada (API_KEY): problema de configuração
  return back(`/?erro=${body.error && KNOWN.has(body.error) ? body.error : "REDE"}`);
}
