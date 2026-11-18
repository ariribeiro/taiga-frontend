import { expect, test, type APIRequestContext } from "@playwright/test";
import { loginOk, unique } from "./helpers";

// Usa o Taiga simulado da porta 9001 com atraso por resposta, para o esqueleto ficar visível por tempo suficiente.
const MOCK = "http://localhost:9001";
const modo = (request: APIRequestContext, m: Record<string, unknown>) => request.post(`${MOCK}/__mode`, { data: m });

test.describe("esqueletos de carregamento", () => {
  test.beforeEach(async ({ request }) => { await request.get(`${MOCK}/__reset`); });
  test.afterAll(async ({ request }) => { await request.get(`${MOCK}/__reset`); });

  test("projetos: o esqueleto aparece na navegação e dá lugar à lista, sem restos", async ({ page }) => {
    await loginOk(page, unique("u"));
    await page.goto("/projects/1");
    await expect(page.locator(".overview")).toBeVisible();
    await modo(page.request, { delayMs: 600 });
    await page.click(".brand");                                                // volta à lista (navegação no navegador)
    const sk = page.locator("[role=status][aria-busy=true]");
    await expect(sk).toBeVisible();
    await expect(sk.locator(".sk").first()).toBeVisible();
    await expect(sk).toContainText("Carregando projetos");                      // texto para leitores de tela
    await expect(page.locator(".pcard strong").first()).toBeVisible();          // a lista real chegou
    await expect(sk).toHaveCount(0);
    await expect(page.locator(".sk")).toHaveCount(0);
  });

  test("projeto: esqueleto da sprint e depois o conteúdo real", async ({ page }) => {
    await loginOk(page, unique("u"));
    await modo(page.request, { delayMs: 600 });
    await page.click(".pcard:has-text('Projeto Alfa') .proj-link");
    await expect(page.locator("[role=status] .sk").first()).toBeVisible();
    await expect(page.locator("[role=status] .sk-kpi").first()).toBeVisible();     // mesma estrutura da página final
    await expect(page.locator(".overview .badge").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("[role=status]")).toHaveCount(0);
  });

  test("página do dev: esqueleto próprio", async ({ page }) => {
    await loginOk(page, unique("u"));
    await page.goto("/projects/1");
    await expect(page.locator(".devcard").first()).toBeVisible();
    await modo(page.request, { delayMs: 600 });
    await page.locator(".devcard", { hasText: "Ana Souza" }).click();
    await expect(page.locator("[role=status]")).toContainText("Carregando");
    await expect(page.getByRole("heading", { name: "Ana Souza" })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("[role=status]")).toHaveCount(0);
  });

  test("modal de detalhes: esqueleto enquanto carrega o item", async ({ page }) => {
    await loginOk(page, unique("u"));
    await page.goto("/projects/1/devs/2");
    await modo(page.request, { delayMs: 800 });
    await page.locator("button.linkbtn", { hasText: "Tela de relatórios" }).click();
    await expect(page.locator("dialog[open] .sk").first()).toBeVisible();
    await expect(page.locator("dialog[open] .modal-t")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("dialog[open] .sk")).toHaveCount(0);
  });

  test("quem pede menos movimento não vê animação", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await loginOk(page, unique("u"));
    await page.goto("/projects/1");
    await modo(page.request, { delayMs: 600 });
    await page.click(".brand");
    await expect(page.locator(".sk").first()).toBeVisible();
    expect(await page.locator(".sk").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  });
});
