import { expect, test } from "@playwright/test";

// Esta instância do front aponta para uma API que não existe (porta sem ninguém escutando).
test.describe("API fora do ar", () => {
  test("a sonda de vida do front continua respondendo (o pod não sai de rotação)", async ({ request }) => {
    expect((await request.get("/healthz")).status()).toBe(200);
  });

  test("o login continua abrindo e, ao entrar, explica que o serviço de dados está indisponível", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("form.login")).toBeVisible();
    await page.fill("input[name=username]", "ana");
    await page.fill("input[name=password]", "senha");
    await page.click("form.login button[type=submit]");
    await expect(page).toHaveURL(/\/\?erro=API/);
    await expect(page.locator(".alert")).toContainText("serviço de dados está indisponível");
  });

  test("sair funciona mesmo sem a API", async ({ request }) => {
    const r = await request.post("/api/logout", { maxRedirects: 0 });
    expect(r.status()).toBe(303);
    expect(r.headers()["location"]).toBe("/");
  });
});
