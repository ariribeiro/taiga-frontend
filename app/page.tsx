import { redirect } from "next/navigation";
import { getMe } from "@/lib/api/client";
import { Logo } from "@/components/ui/primitives";

const MSG: Record<string, string> = {
  "1": "Informe usuário e senha.",
  CRED: "Usuário ou senha inválidos (o Taiga recusou as credenciais).",
  CONFIG: "O serviço de dados não está configurado (TAIGA_URL e usuário de serviço). Avise o administrador.",
  REDE: "O serviço de dados não conseguiu conectar ao Taiga. Tente novamente em instantes; se persistir, avise o administrador.",
  API: "O serviço de dados está indisponível no momento. Tente novamente em instantes.",
  SERVICE_AUTH: "O serviço de dados não conseguiu se autenticar no Taiga (usuário de serviço). Avise o administrador.",
  LIMITE: "Muitas tentativas de login. Aguarde alguns minutos e tente de novo.",
  CERT: "Erro de certificado HTTPS do Taiga. O administrador precisa configurar a CA (NODE_EXTRA_CA_CERTS no back).",
};

export default async function Home(props: { searchParams: Promise<{ erro?: string; m?: string }> }) {
  const searchParams = await props.searchParams; // Next 15+: searchParams é assíncrono
  // Se a API estiver fora do ar, mostra o login com o aviso em vez de uma página de erro
  const me = await getMe().catch(() => null);
  if (me) redirect("/projects");
  return (
    <main className="login-page">
      <section className="hero">
        <Logo />
        <h1>Enxergue o seu time,<br />sprint a sprint.</h1>
        <p>Progresso por desenvolvedor, visão geral da sprint e o que cada pessoa está fazendo — direto do seu Taiga.</p>
        <ul>
          <li>✓ Usa as suas permissões do Taiga</li>
          <li>✓ Sua senha não é armazenada</li>
          <li>✓ Dados sempre atualizados</li>
        </ul>
      </section>
      <form className="card login" method="post" action="/api/login">
        <h2>Entrar</h2>
        <p className="muted">Use seu usuário e senha do Taiga.</p>
        {searchParams.erro && <p className="alert">{searchParams.erro === "LIMITE" ? `Muitas tentativas de login. Tente novamente em ${Math.min(60, Math.max(1, Math.trunc(Number(searchParams.m)) || 1))} min.` : MSG[searchParams.erro] ?? MSG.REDE}</p>}
        <label>Usuário ou e-mail<input name="username" autoComplete="username" required autoFocus /></label>
        <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}
