import Link from "next/link";
import { Header } from "@/components/layout/header";

/** Mostrada quando o projeto pedido não está entre os disponíveis no painel (o usuário de serviço não é membro dele). */
export function Forbidden({ name }: { name: string }) {
  return (
    <>
      <Header name={name} />
      <main className="wrap">
        <h2>Projeto indisponível</h2>
        <p className="muted">Este projeto não está disponível no painel. Se ele deveria aparecer, peça ao administrador para incluir o usuário de serviço como membro dele no Taiga.</p>
        <p><Link href="/projects">← Voltar aos projetos</Link></p>
      </main>
    </>
  );
}
