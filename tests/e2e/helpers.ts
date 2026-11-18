import { expect, type Page } from "@playwright/test";

/** Preenche e envia o formulário de login (o simulador aceita qualquer usuário com a senha "senha"). */
export async function login(page: Page, user = "ana", pass = "senha") {
  await page.goto("/");
  await page.fill("input[name=username]", user);
  await page.fill("input[name=password]", pass);
  await page.click("form.login button[type=submit]");
}

export async function loginOk(page: Page, user = "ana") {
  await login(page, user);
  await page.waitForURL("**/projects");
  await expect(page.getByRole("heading", { name: "Seus projetos" })).toBeVisible();
}

/** Nome de usuário único, para os testes não dividirem o contador de tentativas do login. */
export const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
