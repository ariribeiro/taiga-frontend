import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

// No CI o Playwright usa o Chromium que ele mesmo instala; localmente dá para apontar outro com PW_CHROMIUM_PATH.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

// Os testes de ponta a ponta sobem a PILHA INTEIRA: Taiga simulado + API (repositório taiga-dev-view-back) + este front.
// BACK_DIR aponta para o checkout do back (padrão: pasta irmã). A API precisa estar compilada (`npm run build` lá;
// o script `npm run e2e` já faz isso).
const BACK = resolve(process.env.BACK_DIR ?? "../taiga-dev-view-back");
const KEY = "chave-e2e";

// Taiga simulado (scripts/mock-taiga.mjs do back): uma instância "normal" e uma para os testes de falha.
const mock = (port: number, env: Record<string, string> = {}) => ({
  command: `node ${BACK}/scripts/mock-taiga.mjs`,
  url: `http://localhost:${port}/__stats`,
  reuseExistingServer: !process.env.CI,
  env: { MOCK_PORT: String(port), ...env },
});

// A API, apontando para um Taiga simulado. O usuário de serviço do simulador usa a mesma senha "senha".
const back = (port: number, taigaPort: number, env: Record<string, string> = {}) => ({
  command: `node ${BACK}/dist/server.mjs`,
  url: `http://localhost:${port}/healthz`,
  reuseExistingServer: !process.env.CI,
  timeout: 30_000,
  env: {
    PORT: String(port), LOG_LEVEL: "warn", INTERNAL_API_KEY: KEY,
    TAIGA_URL: `http://localhost:${taigaPort}`, TAIGA_WEB_URL: "https://taiga.exemplo.com",
    TAIGA_SERVICE_USER: "svc-dashboard", TAIGA_SERVICE_PASSWORD: "senha", ...env,
  },
});

// O front em modo produção (precisa de `npm run build` antes), uma instância por configuração a testar.
const front = (port: number, backPort: number) => ({
  command: `npx next start -p ${port}`,
  url: `http://localhost:${port}/healthz`,
  reuseExistingServer: !process.env.CI,
  timeout: 60_000,
  env: { API_URL: `http://localhost:${backPort}`, API_KEY: KEY },
});

export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,               // os testes compartilham servidores (limite de login, sessões, contadores do simulador)
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { launchOptions: { executablePath } },
  webServer: [
    mock(9000),
    mock(9001, { MOCK_DONE: "800" }),                                                  // muitos finalizados + modos de falha
    back(8100, 9000),                                                                  // configuração padrão
    back(8101, 9000, { SESSION_IDLE_MINUTES: "0.05" }),                                // sessão curta (3 s), para testar expiração
    back(8102, 9001, { TAIGA_TIMEOUT_MS: "1500", TAIGA_MAX_CONCURRENCY: "3" }),        // timeout e concorrência baixos
    front(3100, 8100),
    front(3101, 8101),
    front(3102, 8102),
    front(3103, 8199),                                                                 // API fora do ar (nada escuta em 8199)
  ],
  projects: [
    { name: "app", testMatch: /(auth|ratelimit|security|ui)\.spec\.ts/, use: { baseURL: "http://localhost:3100" } },
    { name: "sessao", testMatch: /sessao\.spec\.ts/, use: { baseURL: "http://localhost:3101" } },
    { name: "falhas", testMatch: /(falhas|skeleton)\.spec\.ts/, use: { baseURL: "http://localhost:3102" } },
    { name: "api-fora", testMatch: /api-fora\.spec\.ts/, use: { baseURL: "http://localhost:3103" } },
  ],
});
