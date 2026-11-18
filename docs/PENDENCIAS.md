# Pendências do front

Veja também `docs/MELHORIAS-PENDENTES.md` no repositório da API (sessões em Redis, SSO, cache, observabilidade).

| # | Pendência | Detalhe | Esforço |
|---|---|---|---|
| C | CSP com *nonce* e restrição de imagens | Remover `'unsafe-inline'` de `script-src` (exige `proxy.ts` do Next). Restringir `img-src` ao endereço de mídia do Taiga: hoje aceita qualquer `http(s)` porque fotos e anexos vêm direto do Taiga para o navegador. Alternativa: proxy de mídia autenticado. | M |
| H | Páginas de erro amigáveis | Timeout/queda da API hoje mostra a página de erro padrão do Next (em inglês: "This page couldn’t load"), já que com os esqueletos a resposta começa com 200. Criar `error.tsx` e `not-found.tsx` com mensagem e botão de tentar de novo. | P |
| — | Origin check no `POST /api/login` | O cookie `SameSite=Lax` já protege as ações; checar `Origin` fecharia o *login CSRF*. | P |
| — | `gitleaks` no CI | Evitar segredos no repositório. | P |
| — | Cópia dos tipos do contrato | `lib/api/types.ts` é mantido à mão; gerar a partir de um esquema (OpenAPI/zod) quando o contrato crescer. | M |
