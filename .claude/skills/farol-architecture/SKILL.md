---
name: farol-architecture
description: Regras de arquitetura do front do Farol (Next.js 16 / React 19 / TypeScript). Use ANTES de criar ou alterar páginas, componentes, rotas em app/api, chamadas à API, sessão/cookie, estilos, cabeçalhos de segurança/CSP, Dockerfile ou testes do front. Garante que a evolução mantenha o front como camada de apresentação, sem regra de negócio nem segredo no navegador.
---

# Farol · arquitetura do front (Next.js)

O front **só desenha a tela**. Ele não conhece o Taiga, as regras de negócio nem as credenciais. Quem busca e calcula é a API (repositório `backend`).

```
Navegador ──HTTPS, cookie de sessão──▶ Front (Next.js, única Route)
                                         └─ rede interna, x-api-key + sessão ─▶ API (back) ─▶ Taiga
```

O navegador **nunca** fala com a API nem com o Taiga (exceção: fotos/logos/anexos do Taiga, carregados direto como `<img>`).

## Onde cada coisa vive

| Pasta | Papel |
|---|---|
| `app/**/page.tsx` | **Server Components**: buscam dados com `apiGet` e passam por props. Aqui ficam `redirect`, `notFound` e o tratamento de erro (`renderApiError`). |
| `app/**/loading.tsx` | Esqueleto de carregamento. **Toda rota nova com busca de dados ganha um** (padrão do projeto). |
| `app/api/*/route.ts` | Pontes same-origin (login, logout, item). Único lugar que grava/apaga o cookie de sessão. |
| `components/**` | Interface. `"use client"` **só** onde há interatividade (estado, eventos, efeitos). |
| `lib/api/client.ts` | **server-only.** Único ponto que chama a API (chave `API_KEY`, sessão, timeout, `ApiError`). |
| `lib/api/types.ts` | **Cópia à mão** do contrato do back (veja abaixo). |
| `lib/utils/` | Formatação e apresentação (datas, cores, links). Sem regra de negócio. |
| `app/globals.css` | Todos os estilos, com variáveis (`--accent`…) e tema claro/escuro. |

## Invariantes (não negocie sem avisar o usuário)

1. **Sem regra de negócio no front.** Métrica, classificação, critério, filtro por papel: tudo vem pronto da API. Se precisar de um número novo, ele nasce no back (`domain/`) e chega pelo contrato. O front só formata e exibe. Textos de ajuda que dependem de configuração vêm em `meta`.
2. **Nada de segredo ou chamada à API no navegador.** `lib/api/client.ts` é `server-only`; componente `"use client"` **nunca** o importa. Não use `NEXT_PUBLIC_*`. A chave (`API_KEY`) e o endereço (`API_URL`) existem só no servidor.
3. **O navegador só chama o próprio front** (`/api/...`). Dado novo para um componente de cliente ⇒ crie uma rota em `app/api/` que use `apiFetch`/`sessionId`, valide os parâmetros e traduza erros (veja `app/api/item/route.ts`).
4. **Sessão:** cookie `httpOnly`, `SameSite=Lax`, `Secure` e prefixo `__Host-` em produção, criado **só** em `app/api/login/route.ts`. O `sid` nunca chega ao JavaScript do navegador; não guarde sessão em `localStorage`. (`localStorage` é só para preferência por navegador, como os favoritos.)
5. **Autenticação é da API.** Hoje o login repassa usuário e senha à API; vai migrar para AD. Não implemente verificação de credencial, papel ou permissão no front: trate `401` (volta ao login) e `403` ("Projeto indisponível") como a API responde.
6. **Contrato duplicado:** ao mudar uma resposta, atualize `lib/api/types.ts` **junto** com o back (`docs/API.md` lá) e use o tipo na tela. Campo novo é seguro; renomear/remover é incompatível.
7. **Erros de API** passam por `renderApiError`/`ApiError` (códigos em `{ error: "CODIGO" }`). Mensagem nova na tela de login: `MSG` em `app/page.tsx`. Nunca mostre texto cru da API ao usuário.
8. **Somente leitura.** O front não cria nem altera nada no Taiga. Ação nova que mude estado exige conversa com o usuário (e checagem de `Origin`, pendência já registrada em `docs/PENDENCIAS.md`).
9. **Segurança de conteúdo:** sem `dangerouslySetInnerHTML`; Markdown só via `components/ui/markdown.tsx` (sanitizado); imagem externa só via `components/ui/picture.tsx` (com fallback para iniciais). **Não afrouxe** a CSP em `next.config.mjs` e não adicione scripts/CDNs de terceiros (`script-src 'self'`).
10. **Identidade visual do Farol:** use `Logo`/`LogoFull` (`components/ui/primitives.tsx`) e os arquivos em `public/`. Cores e espaçamentos vêm das variáveis do `globals.css`, nunca valores soltos. **Toda tela nova funciona em tema claro e escuro e no celular** (sem rolagem horizontal).
11. **Docker (standalone):** o Next só empacota o que o build inclui. Arquivo novo lido em tempo de execução fora de `.next` precisa de `COPY` no `Dockerfile` (como já é feito com `public/`).

## Next.js 16 não é o que você conhece

Há mudanças incompatíveis (veja `AGENTS.md`). Antes de escrever código de Next, leia o guia relevante em `node_modules/next/dist/docs/`. Exemplos que já pegam: `params` e `searchParams` são **assíncronos** (`await props.params`); `cookies()` é assíncrono; a opção `dynamic = "force-dynamic"` é usada nas páginas autenticadas.

## Receita: nova tela com dados

1. Confirme que o dado já existe no contrato; se não, peça/implemente no **back primeiro** (ver a skill `farol-architecture` de lá).
2. Tipo em `lib/api/types.ts`.
3. `page.tsx` (Server Component): `getMe()` → `redirect("/")` se não houver sessão → `apiGet<Tipo>(...)` dentro de `try` → `renderApiError(e, me.fullName)` no `catch`.
4. `loading.tsx` com o esqueleto (`components/ui/skeleton.tsx`).
5. Componentes de apresentação em `components/<area>/`; `"use client"` só se precisar.
6. Estilos em `globals.css` (claro/escuro/celular).
7. E2E em `tests/e2e/` cobrindo o caminho feliz e o erro; o simulador do Taiga fica no repositório do back (`scripts/mock-taiga.mjs`).

## Verificação (obrigatória antes de dar por pronto)

- `npx tsc --noEmit` e `npx vitest run`. **Rode pelo PowerShell/terminal do VS Code**, não pelo Git Bash.
- `tests/unit/architecture.test.ts` barra: componente de cliente importando `lib/api/client`, `NEXT_PUBLIC_`, `fetch` fora do cliente da API (exceto para `/api/...`), `API_URL/API_KEY` fora do cliente, `dangerouslySetInnerHTML`, cookie criado fora do login, referência à API do Taiga. **Se falhar, corrija o código, não o teste.** Só altere o teste junto com esta skill.
- E2E (build + back + navegador): `BACK_DIR=<pasta do back> npm run e2e` (no PowerShell: `$env:BACK_DIR='C:\...\backend'`). O `playwright.config.ts` só roda arquivos que casam com o `testMatch` de algum projeto: **spec novo precisa entrar num deles**. Com pouca memória: `NODE_OPTIONS=--max-old-space-size=4096`. Não use `|` em `-g` pelo `npm run` no Windows (o `cmd` interpreta como pipe).
- Se um teste de tempo falhar (esqueleto, favoritos), repita com `--repeat-each` antes de concluir que há defeito: já houve instabilidade sob carga.

## Dívidas conhecidas (não copie o padrão)

- Tipos do contrato mantidos à mão (a meta é gerar a partir de um esquema).
- CSP com `'unsafe-inline'` e `img-src` amplo (pendência C).
- Páginas de erro padrão do Next quando a API cai (pendência H).
- Sem origin check no `POST /api/login`.

## Pare e pergunte ao usuário quando a mudança

- precisar de regra de negócio, permissão ou credencial no front;
- expor qualquer variável ou chamada de API ao navegador;
- adicionar dependência (bibliotecas de UI, estado, gráficos, CDNs): o front é enxuto de propósito;
- afrouxar a CSP, gravar algo além da sessão/favoritos no navegador, ou alterar dados no Taiga.
