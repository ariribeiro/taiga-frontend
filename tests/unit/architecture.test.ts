import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Regras estruturais da arquitetura do front (veja .claude/skills/farol-architecture/SKILL.md).
 * Verificações simples sobre o texto dos arquivos: servem para o CI barrar violações óbvias, não para substituir a revisão.
 * Se uma regra precisar mudar, mude a skill e este teste juntos.
 */
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const walk = (dir: string): string[] =>
  readdirSync(join(ROOT, dir)).flatMap((n) => {
    const p = join(dir, n);
    return statSync(join(ROOT, p)).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
const files = ["app", "components", "lib"].flatMap(walk).map((f) => ({ file: relative("", f).replace(/\\/g, "/"), text: readFileSync(join(ROOT, f), "utf8") }));
const isClient = (t: string) => /^\s*["']use client["']/.test(t);
const importsOf = (t: string) => [...t.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);

describe("arquitetura do front", () => {
  it("componentes de cliente nunca importam o cliente da API (que lê a chave e a sessão)", () => {
    for (const { file, text } of files.filter((f) => isClient(f.text))) {
      expect(importsOf(text), `${file} é "use client" e importa lib/api/client`).not.toContain("@/lib/api/client");
      expect(importsOf(text), `${file} é "use client" e importa server-only`).not.toContain("server-only");
    }
  });

  it("lib/api/client.ts é server-only", () => {
    expect(files.find((f) => f.file === "lib/api/client.ts")!.text).toMatch(/import\s+["']server-only["']/);
  });

  it("nenhuma variável vai para o navegador (sem NEXT_PUBLIC_)", () => {
    for (const { file, text } of files) expect(text, `${file} usa NEXT_PUBLIC_`).not.toMatch(/NEXT_PUBLIC_/);
  });

  it("só lib/api/client.ts chama a API; o navegador só chama rotas do próprio front (/api/...)", () => {
    for (const { file, text } of files.filter((f) => f.file !== "lib/api/client.ts")) {
      for (const m of text.matchAll(/\bfetch\(\s*([`"'])([^`"']*)/g)) expect(m[2], `${file}: fetch fora de lib/api/client.ts deve ir para /api/...`).toMatch(/^\/api\//);
      expect(text, `${file} fala com a API direto`).not.toMatch(/process\.env\.API_(URL|KEY)/);
    }
  });

  it("nada de HTML injetado sem sanitizar", () => {
    for (const { file, text } of files) expect(text, `${file} usa dangerouslySetInnerHTML`).not.toMatch(/dangerouslySetInnerHTML/);
  });

  it("o cookie de sessão só é criado no login, e sempre httpOnly", () => {
    for (const { file, text } of files) {
      if (file === "app/api/login/route.ts") expect(text).toMatch(/httpOnly:\s*true/);
      else expect(text, `${file} grava cookie`).not.toMatch(/cookies\(\)\)\.set\(/);
    }
  });

  it("o front não conhece o Taiga: sem URL do Taiga nem chamada à API dele", () => {
    for (const { file, text } of files) expect(text, `${file} cita a API do Taiga`).not.toMatch(/\/api\/v1/);
  });
});
