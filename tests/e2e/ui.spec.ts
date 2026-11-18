import { expect, test } from "@playwright/test";
import { loginOk, unique } from "./helpers";

test.describe("projetos", () => {
  test("acesso: projeto em que o usuário não é Servidor Dirti/Fiscal fica bloqueado", async ({ page }) => {
    await loginOk(page, unique("u"));
    await page.goto("/projects/77");
    await expect(page.getByRole("heading", { name: "Acesso restrito" })).toBeVisible();
    await page.goto("/projects/1");
    await expect(page.getByRole("heading", { name: "Acesso restrito" })).toHaveCount(0);
  });

  test("favoritos: marcar sobe o projeto para o topo e persiste ao recarregar", async ({ page }) => {
    await loginOk(page, unique("u"));
    const nomes = () => page.locator(".pcard strong").allInnerTexts();
    await page.locator(".pl.ready").waitFor();
    expect((await nomes())[0]).toBe("Projeto Alfa");                       // ordem original
    await expect(page.locator(".fav-h")).toHaveCount(0);

    await page.click(".pcard:has-text('App Mobile') .star");
    await page.click(".pcard:has-text('Data Lake') .star");
    expect((await nomes()).slice(0, 2)).toEqual(["App Mobile", "Data Lake"]);
    await expect(page.locator(".fav-h").first()).toContainText("Favoritos");
    await expect(page).toHaveURL(/\/projects$/);                           // clicar na estrela não navega

    await page.reload();
    await page.locator(".pl.ready").waitFor();
    expect((await nomes()).slice(0, 2)).toEqual(["App Mobile", "Data Lake"]);

    await page.click(".pcard:has-text('App Mobile') .star");               // desmarcar
    expect((await nomes())[0]).toBe("Data Lake");
  });

  test("os favoritos são separados por navegador (nada vai para o servidor)", async ({ page }) => {
    await loginOk(page, unique("u"));
    await page.click(".pcard:has-text('App Mobile') .star");
    const guardado = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("tdv:favorites:")));
    expect(guardado).toHaveLength(1);
  });

  test("seletor de projeto: busca, troca e abre a visão certa (Scrum x Kanban)", async ({ page }) => {
    await loginOk(page, unique("u"));
    await page.goto("/projects/1");
    await page.click(".psw-btn");
    await expect(page.locator(".psw-item.on")).toContainText("Projeto Alfa");
    await page.fill(".psw-search", "kanban");
    await expect(page.locator(".psw-item")).toHaveCount(1);
    await page.click(".psw-item");
    await expect(page).toHaveURL(/\/projects\/10$/);
    await expect(page.locator(".kcols")).toBeVisible();                    // projeto sem Scrum abre a visão de fluxo
    await expect(page.locator(".psw-name")).toContainText("Quadro Kanban");
  });
});

test.describe("sprint (Scrum)", () => {
  test.beforeEach(async ({ page }) => { await loginOk(page, unique("u")); await page.goto("/projects/1"); });

  test("resumo: selo de ritmo, indicadores e burndown", async ({ page }) => {
    await expect(page.locator(".overview .badge").first()).toHaveText(/Atrasada|No ritmo|Acima do ritmo/);
    await expect(page.locator(".kpis")).toContainText("pontos");
    await expect(page.locator(".kpis")).toContainText("sem responsável");
    await expect(page.locator("svg.bd")).toBeVisible();
    await page.locator(".fold > summary").click();                         // recolher o burndown
    await expect(page.locator("svg.bd")).toBeHidden();
    await expect(page.locator(".fold > summary")).toContainText("Restam");
  });

  test("cards só dos papéis permitidos; quem tem impedimento é destacado", async ({ page }) => {
    const nomes = await page.locator(".devcard strong").allInnerTexts();
    expect(nomes.sort()).toEqual(["Ana Souza", "Bruno Lima", "Eva Rocha", "Gil Semcampo"]);   // fora: Product Owner, inativo e não-membros
    for (const n of ["Ana Souza", "Bruno Lima"]) await expect(page.locator(".devcard", { hasText: n })).toHaveClass(/blocked/);
    await expect(page.locator(".devcard", { hasText: "Eva Rocha" })).not.toHaveClass(/blocked/);
    await expect(page.locator(".devcard", { hasText: "Eva Rocha" })).toContainText("Sem atividade");
    await expect(page.locator(".dc-block").first()).toContainText("impedimento");
  });

  test("o ? explica os critérios com os números da sprint", async ({ page }) => {
    await page.click(".help-btn");
    const dlg = page.locator("dialog.help[open]");
    await expect(dlg).toContainText("10 pontos percentuais");
    await expect(dlg).toContainText("Nesta sprint");
    await expect(dlg).toContainText("Quem aparece");
    await page.keyboard.press("Escape");
    await expect(dlg).toHaveCount(0);
  });

  test("seletor de sprint troca sem botão", async ({ page }) => {
    await page.selectOption("select[name=sprint]", { label: "Sprint 11 (fechada)" });
    await expect(page).toHaveURL(/sprint=9/);
    await expect(page.locator(".overview .badge").first()).toHaveText("Fechada");
  });

  test("'sem responsável' abre a lista e cada item abre o detalhe por cima", async ({ page }) => {
    await page.click(".kpi-btn");
    const lista = page.locator("dialog[open] .m-body");
    await expect(lista).toContainText("Exportar CSV");
    await expect(lista).toContainText("Definir esquema de cache");
    await lista.locator("button.linkbtn", { hasText: "Exportar CSV" }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(2);              // um modal sobre o outro
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(1);              // ESC fecha só o de cima
  });
});

test.describe("detalhe de story", () => {
  test.beforeEach(async ({ page }) => {
    await loginOk(page, unique("u"));
    await page.goto("/projects/1/devs/2");
    await page.locator("button.linkbtn", { hasText: "Tela de relatórios" }).click();
    await expect(page.locator("dialog[open] .md").first()).toBeVisible();
  });

  test("Markdown renderizado (sem asteriscos crus), tasks, comentários e link para o Taiga", async ({ page }) => {
    const d = page.locator("dialog[open]");
    await expect(d.locator(".md strong").first()).toBeVisible();
    await expect(d.locator(".md table th")).toHaveCount(2);
    await expect(d.locator(".md input[type=checkbox]")).toHaveCount(2);
    await expect(d.locator(".md pre code")).toHaveCount(1);
    expect(await d.innerText()).not.toContain("**");
    await expect(d.locator(".md a").first()).toHaveAttribute("rel", "noopener noreferrer");
    await expect(d.locator(".trows li")).not.toHaveCount(0);
    await expect(d.locator(".cmts")).toContainText("Bruno Lima");
    await expect(d.locator(".btn-link")).toHaveAttribute("href", "https://taiga.exemplo.com/project/projeto-alfa/us/102");
  });

  test("imagens: relativa resolvida, quebrada vira link, e o modal não estoura a largura", async ({ page }) => {
    const d = page.locator("dialog[open]");
    await expect(d.locator(".md img").first()).toHaveJSProperty("complete", true);
    await expect(d.locator(".img-fail")).toHaveCount(1);                    // a imagem quebrada do exemplo
    expect(await d.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test("galeria de anexos: setas, teclado, miniatura quebrada e ESC fecha só a galeria", async ({ page }) => {
    await page.locator(".gthumb").first().click();
    const lb = page.locator(".lb[open]");
    await expect(lb.locator(".lb-count")).toHaveText(/^1 \/ \d+$/);
    await page.keyboard.press("ArrowRight");
    await expect(lb.locator(".lb-count")).toHaveText(/^2 \/ \d+$/);
    await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowLeft");   // volta ao fim (cíclico)
    await expect(lb.locator(".lb-count")).not.toHaveText(/^1 \//);
    await lb.locator(".lb-next").click();
    await expect(lb.locator(".lb-count")).toHaveText(/^1 \//);
    await page.keyboard.press("Escape");
    await expect(lb).toHaveCount(0);
    await expect(page.locator("dialog.modal[open]")).toHaveCount(1);        // o modal da story continua aberto
  });
});

test.describe("Kanban", () => {
  test.beforeEach(async ({ page }) => { await loginOk(page, unique("u")); await page.goto("/projects/10"); });

  test("quadro com totais por coluna (o total de finalizados vem do cabeçalho de contagem)", async ({ page }) => {
    const col = (n: string) => page.locator(".kcol", { hasText: n });
    await expect(col("NOVO")).toContainText("4");
    await expect(col("FINALIZADO")).toContainText("300");
    await expect(col("ARQUIVADO")).toContainText("0");
    await expect(col("EM ANDAMENTO")).toHaveClass(/over/);                  // 4 itens, limite de WIP 3
    await expect(col("EM ANDAMENTO")).toContainText("limite 3");
  });

  test("indicadores, vazão semanal e listas", async ({ page }) => {
    await expect(page.locator(".kpis")).toContainText("em andamento");
    await expect(page.locator(".kpis")).toContainText("impedidos");
    await expect(page.locator(".kpis")).toContainText("tempo de entrega");
    await expect(page.locator(".kbar")).toHaveCount(4);                     // 28 dias = 4 semanas
    await expect(page.getByText("Sem movimento há mais tempo")).toBeVisible();
    await expect(page.getByText("Impedimentos", { exact: false }).first()).toBeVisible();
  });

  test("trocar o período atualiza a página sem botão", async ({ page }) => {
    await page.selectOption("select[name=days]", "84");
    await expect(page).toHaveURL(/days=84/);
    await expect(page.locator(".kbar")).toHaveCount(12);
    await page.selectOption("select[name=days]", "14");
    await expect(page.locator(".kbar")).toHaveCount(2);
  });

  test("cards por pessoa abrem a lista de itens, e o item abre o detalhe", async ({ page }) => {
    const card = page.locator(".kdev").filter({ hasText: "Ana Souza" });
    await card.locator("summary").click();
    await expect(card.locator(".kitems li").first()).toBeVisible();
    await card.locator(".kitems button.linkbtn").first().click();
    await expect(page.locator("dialog[open] .modal-t")).toBeVisible();
  });

  test("a página de sprint de um dev avisa que o projeto é Kanban", async ({ page }) => {
    await page.goto("/projects/10/devs/1");
    await expect(page.getByText("usa Kanban")).toBeVisible();
  });
});
