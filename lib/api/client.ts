import "server-only"; // o build falha se algum componente de cliente importar este módulo (ele lê a chave da API)
import { cache } from "react";
import { cookies } from "next/headers";
import type { TProject, User } from "./types";

/** Endereço INTERNO da API (Service do OpenShift). O navegador nunca fala com ela: só este servidor. */
export const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(/\/+$/, "");
const API_KEY = process.env.API_KEY ?? "";
const TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS) > 0 ? Number(process.env.API_TIMEOUT_MS) : 45_000;

// Em produção (HTTPS) o prefixo __Host- obriga Secure + Path=/ e impede o cookie de ser sobrescrito por subdomínios.
export const COOKIE = process.env.NODE_ENV === "production" ? "__Host-tdv_sid" : "tdv_sid";

/** Erro da API (code = campo "error" da resposta) ou 0/"API" quando ela não responde. */
export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(`API ${status} ${code}`);
  }
}

export const sessionId = async (): Promise<string | null> => (await cookies()).get(COOKIE)?.value ?? null;

/** Chamada à API com a chave interna e (se houver) a sessão. Falha de rede vira ApiError(0, "API"). */
export async function apiFetch(path: string, init: { method?: string; body?: unknown; sid?: string | null; headers?: Record<string, string> } = {}): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        ...(init.sid ? { authorization: `Bearer ${init.sid}` } : {}),
        ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    console.error("[api] sem resposta de", `${API_URL}${path}`, "->", (e as { cause?: { code?: string } }).cause?.code ?? (e as Error).message);
    throw new ApiError(0, "API");
  }
}

const errorCode = async (res: Response) => ((await res.json().catch(() => ({}))) as { error?: string }).error ?? `HTTP${res.status}`;

/** GET na API com a sessão do cookie. Respostas de erro viram ApiError. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path, { sid: await sessionId() });
  if (!res.ok) throw new ApiError(res.status, await errorCode(res));
  return (await res.json()) as T;
}

/** Quem está logado (null = sem sessão ou sessão expirada). Uma chamada por requisição, mesmo usada em vários componentes. */
export const getMe = cache(async (): Promise<User | null> => {
  if (!(await sessionId())) return null;
  try { return await apiGet<User>("/me"); }
  catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; }
});

export const getProjects = cache(async (fresh: boolean): Promise<TProject[]> =>
  (await apiGet<{ projects: TProject[] }>(`/projects${fresh ? "" : "?cache=1"}`)).projects);
