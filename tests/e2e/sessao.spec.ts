import { expect, test } from "@playwright/test";
import { loginOk, unique } from "./helpers";

// Esta instância do app usa SESSION_IDLE_MINUTES=0.05 (3 segundos de inatividade).
test.describe("expiração de sessão por inatividade", () => {
  test("o uso renova o prazo; parar além do limite encerra a sessão", async ({ page, context, request }) => {
    await loginOk(page, unique("u"));
    const sid = (await context.cookies()).find((x) => x.name.endsWith("tdv_sid"))!.value;

    for (let i = 0; i < 3; i++) {                                    // 3 usos espaçados de 2 s (< 3 s): a sessão continua valendo
      await page.waitForTimeout(2000);
      await page.goto("/projects");
      await expect(page).toHaveURL(/\/projects$/);
    }

    await page.waitForTimeout(3600);                                 // parou por mais de 3 s
    await page.goto("/projects");
    await expect(page).toHaveURL("/");                               // voltou ao login

    const velha = await request.get("/api/item?kind=us&id=1&project=1", { headers: { cookie: `__Host-tdv_sid=${sid}` } });
    expect(velha.status()).toBe(401);                                // o cookie antigo é recusado
  });
});
