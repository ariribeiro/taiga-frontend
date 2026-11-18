import { expect, test } from "@playwright/test";
import { unique } from "./helpers";

// Limite padrão: 8 senhas erradas por usuário em 15 minutos.
const tentar = async (request: import("@playwright/test").APIRequestContext, user: string, senha: string) =>
  (await request.post("/api/login", { form: { username: user, password: senha }, maxRedirects: 0 })).headers()["location"];

test.describe("freio de força bruta no login", () => {
  test("bloqueia depois de 8 senhas erradas, mesmo com a senha certa", async ({ request }) => {
    const user = unique("vitima");
    for (let i = 1; i <= 8; i++) expect(await tentar(request, user, "errada"), `tentativa ${i}`).toBe("/?erro=CRED");
    expect(await tentar(request, user, "senha")).toMatch(/^\/\?erro=LIMITE&m=\d+$/);
  });

  test("o bloqueio vale para o usuário, não para os outros", async ({ request }) => {
    const user = unique("vitima");
    for (let i = 0; i < 8; i++) await tentar(request, user, "errada");
    expect(await tentar(request, user, "senha")).toContain("LIMITE");
    expect(await tentar(request, unique("outro"), "senha")).toBe("/projects");
  });

  test("não diferencia maiúsculas de minúsculas no nome de usuário", async ({ request }) => {
    const user = unique("vitima");
    for (let i = 0; i < 8; i++) await tentar(request, user, "errada");
    expect(await tentar(request, user.toUpperCase(), "senha")).toContain("LIMITE");
  });

  test("um login correto zera o contador", async ({ request }) => {
    const user = unique("zera");
    for (let i = 0; i < 5; i++) await tentar(request, user, "errada");
    expect(await tentar(request, user, "senha")).toBe("/projects");
    for (let i = 0; i < 5; i++) expect(await tentar(request, user, "errada")).toBe("/?erro=CRED");   // 5 + 5 > 8, mas zerou no meio
    expect(await tentar(request, user, "senha")).toBe("/projects");
  });

  test("a tela mostra o tempo de espera e ignora valor malicioso em m", async ({ page }) => {
    await page.goto("/?erro=LIMITE&m=7");
    await expect(page.locator(".alert")).toContainText("Tente novamente em 7 min");
    await page.goto("/?erro=LIMITE&m=%3Cscript%3Ealert(1)%3C/script%3E");
    await expect(page.locator(".alert")).toContainText("Tente novamente em 1 min");
    await expect(page.locator(".alert script")).toHaveCount(0);
  });
});
