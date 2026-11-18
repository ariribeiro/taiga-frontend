import { describe, expect, it } from "vitest";
import { clientIp } from "@/lib/api/client-ip";

const h = (o: Record<string, string>) => new Headers(o);

describe("clientIp (IP repassado à API para o freio de login)", () => {
  it("atrás do roteador, vale o último IP do X-Forwarded-For (o que o roteador viu)", () => {
    expect(clientIp(h({ "x-forwarded-for": "200.1.1.1" }))).toBe("200.1.1.1");
  });
  it("não aceita o começo da lista, que o cliente pode forjar", () => {
    expect(clientIp(h({ "x-forwarded-for": "1.2.3.4, 9.9.9.9, 200.1.1.1" }))).toBe("200.1.1.1");
  });
  it("com mais de um proxy confiável (hops), pula também os de trás", () => {
    expect(clientIp(h({ "x-forwarded-for": "forjado, 200.1.1.1, 10.0.0.5" }), 2)).toBe("200.1.1.1");
    expect(clientIp(h({ "x-forwarded-for": "200.1.1.1" }), 3)).toBe("200.1.1.1");
  });
  it("sem X-Forwarded-For, usa X-Real-IP e, por fim, 'desconhecido'", () => {
    expect(clientIp(h({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(h({}))).toBe("desconhecido");
  });
});
