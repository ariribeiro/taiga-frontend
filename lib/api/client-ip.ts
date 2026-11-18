/**
 * IP do cliente para o freio de login da API. Atrás do roteador do OpenShift, o cabeçalho X-Forwarded-For chega
 * como "<o que o cliente mandou>, <IP real visto pelo roteador>": o cliente pode forjar o começo da lista, então
 * contamos a partir do FIM, pulando os proxies confiáveis (TRUSTED_PROXY_HOPS, padrão 1 = só o roteador).
 */
export function clientIp(headers: Headers, hops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS) || 1)): string {
  const parts = (headers.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length) return parts[Math.max(0, parts.length - hops)];
  return headers.get("x-real-ip") || "desconhecido";
}
