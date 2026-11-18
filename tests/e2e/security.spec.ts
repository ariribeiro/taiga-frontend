import { expect, test } from "@playwright/test";
import { loginOk } from "./helpers";

test.describe("cabeçalhos e superfície de ataque", () => {
  test("cabeçalhos de segurança em todas as respostas", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toContain("form-action 'self'");
    expect(h["content-security-policy"]).toContain("object-src 'none'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"]).toContain("camera=()");
    expect(h["cross-origin-opener-policy"]).toBe("same-origin");
    expect(h["strict-transport-security"]).toContain("max-age=");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("o otimizador de imagens está desligado", async ({ request }) => {
    expect((await request.get("/_next/image?url=%2Flogo.svg&w=64&q=75")).status()).toBe(404);
  });

  test("API de detalhes rejeita parâmetros inválidos", async ({ page }) => {
    await loginOk(page);
    for (const q of ["kind=x&id=1&project=1", "kind=us&id=abc&project=1", "kind=us&id=1&project=1;drop", "kind=us&id=1.5&project=1"])
      expect((await page.request.get(`/api/item?${q}`)).status(), q).toBe(400);
  });

  test("anexos com esquema perigoso (javascript:, ftp:) são descartados", async ({ page }) => {
    await loginOk(page);
    const d = await (await page.request.get("/api/item?kind=us&id=2&project=1")).json();
    const urls: string[] = d.attachments.map((a: { url: string }) => a.url);
    expect(urls.length).toBeGreaterThan(0);
    for (const u of urls) expect(u).toMatch(/^https?:\/\//);
    expect(d.attachments.map((a: { name: string }) => a.name)).not.toContain("malicioso.png");
    expect(d.attachments.map((a: { name: string }) => a.name)).not.toContain("ftp.pdf");
  });

  test("HTML malicioso na descrição não executa (onerror é removido)", async ({ page }) => {
    let alertas = 0;
    page.on("dialog", (d) => { alertas++; void d.dismiss(); });
    await loginOk(page);
    await page.goto("/projects/1/devs/2");
    await page.locator("button.linkbtn", { hasText: "Tela de relatórios" }).click();
    await expect(page.locator("dialog[open] .md").first()).toBeVisible();
    await page.waitForTimeout(800);
    expect(await page.locator("dialog[open] img[onerror]").count()).toBe(0);
    expect(alertas).toBe(0);
  });

  test("a interface inteira roda sem nenhuma violação da política de conteúdo (CSP)", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __v: string[] }).__v = [];
      document.addEventListener("securitypolicyviolation", (e) => (window as unknown as { __v: string[] }).__v.push(`${e.violatedDirective} → ${e.blockedURI}`));
    });
    const consoleCsp: string[] = [];
    page.on("console", (m) => { if (m.type() === "error" && /Content Security Policy|Refused to/i.test(m.text())) consoleCsp.push(m.text()); });
    const erros: string[] = [];
    page.on("pageerror", (e) => erros.push(e.message));

    await loginOk(page);
    await page.click(".pcard:has-text('Projeto Alfa') .star");
    await page.click(".psw-btn"); await page.keyboard.press("Escape");
    await page.goto("/projects/1");
    await expect(page.locator("svg.bd")).toBeVisible();
    await page.click(".help-btn"); await expect(page.locator("dialog.help[open]")).toBeVisible(); await page.keyboard.press("Escape");
    await page.click(".kpi-btn"); await expect(page.locator("dialog[open] .m-body")).toBeVisible(); await page.keyboard.press("Escape");
    await page.goto("/projects/1/devs/2");
    await page.locator("button.linkbtn", { hasText: "Tela de relatórios" }).click();
    await expect(page.locator("dialog[open] .md").first()).toBeVisible();
    await page.locator(".gthumb").first().click();
    await expect(page.locator(".lb[open] .lb-stage img")).toBeVisible();
    await page.keyboard.press("ArrowRight"); await page.keyboard.press("Escape"); await page.keyboard.press("Escape");
    await page.goto("/projects/10");
    await expect(page.locator(".kcols")).toBeVisible();
    await page.getByRole("button", { name: "Sair" }).click();

    expect(await page.evaluate(() => (window as unknown as { __v: string[] }).__v)).toEqual([]);
    expect(consoleCsp).toEqual([]);
    expect(erros).toEqual([]);
  });
});
