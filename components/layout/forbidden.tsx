import Link from "next/link";
import { Header } from "@/components/layout/header";

/** Mostrada quando o usuário não é Servidor Dirti/Fiscal no projeto pedido. */
export function Forbidden({ name }: { name: string }) {
  return (
    <>
      <Header name={name} />
      <main className="wrap">
        <h2>Acesso restrito</h2>
        <p className="muted">Este sistema é para quem tem o papel “Servidor Dirti/Fiscal” no projeto. Você não tem esse papel neste projeto.</p>
        <p><Link href="/projects">← Voltar aos meus projetos</Link></p>
      </main>
    </>
  );
}
