import Link from "next/link";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { Forbidden } from "@/components/layout/forbidden";
import { Header } from "@/components/layout/header";

/**
 * Tratamento padrão de erros da API nas páginas, para usar no `catch`:
 *  - 401: sessão expirada, volta ao login;
 *  - 403: "Acesso restrito" (a pessoa não tem o papel no projeto);
 *  - 404: mensagem com link para a lista;
 *  - qualquer outro erro é relançado (página de erro do Next).
 */
export function renderApiError(e: unknown, userName: string) {
  if (!(e instanceof ApiError)) throw e;
  if (e.status === 401) redirect("/");
  if (e.status === 403) return <Forbidden name={userName} />;
  if (e.status === 404) {
    return (
      <>
        <Header name={userName} />
        <main className="wrap"><p className="err">Sem permissão ou projeto não encontrado.</p><Link href="/projects">Voltar</Link></main>
      </>
    );
  }
  throw e;
}
