import { expect, test, type APIRequestContext } from "@playwright/test";
import { loginOk, unique } from "./helpers";

// Esta instância usa o Taiga simulado da porta 9001 (800 finalizados), TAIGA_TIMEOUT_MS=1500 e TAIGA_MAX_CONCURRENCY=3.
const MOCK = "http://localhost:9001";
const modo = (request: APIRequestContext, m: Record<string, unknown>) => request.post(`${MOCK}/__mode`, { data: m });
const stats = async (request: APIRequestContext) => (await request.get(`${MOCK}/__stats`)).json() as Promise<{ maxInflight: number }>;

test.describe("falhas do Taiga", () => {
  test.beforeEach(async ({ request }) => { await request.get(`${MOCK}/__reset`); });
  test.afterAll(async ({ request }) => { await request.get(`${MOCK}/__reset`); });

  test("Taiga travado: a página responde em poucos segundos, sem ficar pendurada", async ({ page }) => {
    await loginOk(page, unique("u"));
    await modo(page.request, { hang: "/milestones" });
    const t0 = Date.now();
    await page.goto("/projects/1");
    // Com o esqueleto (loading.tsx) a resposta já começou com 200, então a falha aparece na própria página:
    // o esqueleto some e dá lugar à página de erro do Next, em poucos segundos.
    await expect(page.getByText("This page couldn’t load")).toBeVisible({ timeout: 5000 });
    expect(Date.now() - t0).toBeLessThan(6000);
    await expect(page.locator("[role=status]")).toHaveCount(0);
    await modo(page.request, { hang: null });
    expect((await page.goto("/projects"))!.status()).toBe(200);      // o resto do app segue funcionando
  });

  test("histórico travado: o modal de detalhes ainda abre, sem comentários", async ({ page }) => {
    await loginOk(page, unique("u"));
    await modo(page.request, { hang: "/history" });
    const t0 = Date.now();
    const r = await page.request.get("/api/item?kind=us&id=2&project=1");
    expect(Date.now() - t0).toBeLessThan(4000);
    expect(r.status()).toBe(200);
    expect((await r.json()).comments).toEqual([]);
  });

  test("falha temporária (503 na 1ª chamada de cada endereço): as páginas carregam", async ({ page }) => {
    await loginOk(page, unique("u"));
    await modo(page.request, { flaky: true });
    expect((await page.goto("/projects/1"))!.status()).toBe(200);
    await expect(page.locator(".overview")).toBeVisible();
  });

  test("limita as requisições simultâneas ao Taiga (máximo 3)", async ({ page, request }) => {
    await loginOk(page, unique("u"));
    await modo(page.request, { delayMs: 150 });
    expect((await page.goto("/projects/1"))!.status()).toBe(200);   // a sprint dispara várias chamadas em paralelo
    expect((await stats(request)).maxInflight).toBeLessThanOrEqual(3);
    expect((await stats(request)).maxInflight).toBeGreaterThan(0);
  });

  test("Kanban com muitos finalizados e Taiga sem ordenação: avisa que a amostra é parcial", async ({ page }) => {
    await loginOk(page, unique("u"));
    await modo(page.request, { noOrder: true });
    await page.goto("/projects/10?days=28");
    await expect(page.locator(".kcol", { hasText: "FINALIZADO" })).toContainText("800");     // o total vem do cabeçalho, sem baixar tudo
    await expect(page.locator(".alert")).toContainText("não ordenou a lista");
    await expect(page.locator(".kpis .kpi").nth(3)).toContainText("—");                        // não inventa o número
  });
});
