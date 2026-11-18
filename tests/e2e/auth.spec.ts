import { expect, test } from "@playwright/test";
import { login, loginOk, unique } from "./helpers";

test.describe("login e sessão", () => {
  test("entra com a senha certa e cai na lista de projetos", async ({ page }) => {
    await loginOk(page);
  });

  test("senha errada mostra uma mensagem clara", async ({ page }) => {
    await login(page, unique("u"), "errada");
    await expect(page.locator(".alert")).toContainText("Usuário ou senha inválidos");
    await expect(page).toHaveURL(/\/\?erro=CRED/);
  });

  test("o POST responde com redirecionamento RELATIVO (funciona em qualquer endereço)", async ({ request }) => {
    const ok = await request.post("/api/login", { form: { username: unique("u"), password: "senha" }, maxRedirects: 0 });
    expect(ok.status()).toBe(303);
    expect(ok.headers()["location"]).toBe("/projects");
    const erro = await request.post("/api/login", { form: { username: unique("u"), password: "x" }, maxRedirects: 0 });
    expect(erro.headers()["location"]).toBe("/?erro=CRED");
  });

  for (const host of ["localhost", "127.0.0.1"]) {
    test(`login e logout funcionam abrindo por ${host}`, async ({ browser }) => {
      const page = await (await browser.newContext()).newPage();
      await page.goto(`http://${host}:3100/`);
      await page.fill("input[name=username]", unique("u"));
      await page.fill("input[name=password]", "senha");
      await page.click("form.login button[type=submit]");
      await expect(page).toHaveURL(`http://${host}:3100/projects`);
      await page.getByRole("button", { name: "Sair" }).click();
      await expect(page).toHaveURL(`http://${host}:3100/`);
      await page.goto(`http://${host}:3100/projects`);
      await expect(page).toHaveURL(`http://${host}:3100/`);      // sessão encerrada de verdade
    });
  }

  test("cookie de sessão: HttpOnly, SameSite=Lax e prefixo __Host- com Secure", async ({ page, context }) => {
    await loginOk(page);
    const c = (await context.cookies()).find((x) => x.name.endsWith("tdv_sid"))!;
    expect(c.name).toBe("__Host-tdv_sid");
    expect(c).toMatchObject({ httpOnly: true, secure: true, sameSite: "Lax", path: "/" });
    expect(c.value).toMatch(/^[0-9a-f]{64}$/);                   // 32 bytes aleatórios
  });

  test("sem sessão, as páginas voltam ao login e a API responde 401", async ({ page, request }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL("/");
    await page.goto("/projects/1");
    await expect(page).toHaveURL("/");
    expect((await request.get("/api/item?kind=us&id=1&project=1")).status()).toBe(401);
  });

  test("um novo login invalida a sessão anterior daquele navegador", async ({ page, context, request }) => {
    await loginOk(page);
    const sid1 = (await context.cookies()).find((x) => x.name.endsWith("tdv_sid"))!.value;
    const antiga = (cookie: string) => request.get("/api/item?kind=us&id=1&project=1", { headers: { cookie: `__Host-tdv_sid=${cookie}` } });
    expect((await antiga(sid1)).status()).not.toBe(401);                 // a sessão 1 vale
    await page.request.post("/api/login", { form: { username: unique("u"), password: "senha" }, maxRedirects: 0 });   // novo login, mesmo navegador
    const sid2 = (await context.cookies()).find((x) => x.name.endsWith("tdv_sid"))!.value;
    expect(sid2).not.toBe(sid1);
    expect((await antiga(sid1)).status()).toBe(401);                     // a sessão 1 deixou de valer
    expect((await antiga(sid2)).status()).not.toBe(401);
  });
});
