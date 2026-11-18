// Sonda de vida do OpenShift (liveness/readiness). Não depende da API: se ela cair, o front continua
// servindo o login com um aviso, em vez de sair de rotação.
export const dynamic = "force-dynamic";
export function GET() { return Response.json({ status: "ok" }); }
