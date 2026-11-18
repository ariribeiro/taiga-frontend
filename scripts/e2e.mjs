// Compila a API (BACK_DIR) e este front e roda o Playwright. Uso: npm run e2e [-- argumentos do playwright]
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const back = resolve(process.env.BACK_DIR ?? "../taiga-dev-view-back");
const run = (cmd, args, cwd = process.cwd(), env = {}) => {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, ...env }, shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run("npm", ["run", "build"], back);
run("npm", ["run", "build"]);
run("npx", ["playwright", "test", ...process.argv.slice(2)], process.cwd(), { BACK_DIR: back });
