"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type HelpInfo = {
  sprint: string; closed: boolean;
  progress: number; expected: number | null; diff: number; state: "closed" | "ahead" | "late" | "ok";
  tolerance: number; hasPoints: boolean; blockedPattern: string; roles: string[] | null;
};

const LABEL = { closed: "Fechada", ahead: "Acima do ritmo", late: "Atrasada", ok: "No ritmo" } as const;

function Dialog({ info, onClose }: { info: HelpInfo; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  const t = info.tolerance;
  const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  return (
    <dialog ref={ref} className="modal sm help" onClose={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
      <div className="modal-in">
        <header className="m-head">
          <div className="m-title"><p className="muted">Ajuda</p><h3 className="modal-t">Como os indicadores são calculados</h3></div>
          <div className="m-actions"><button className="modal-x ghost" onClick={() => ref.current?.close()} aria-label="Fechar">✕</button></div>
        </header>

        <div className="m-body help-body">
          <section>
            <h4 className="sec">Ritmo da sprint</h4>
            <p>Compara o <b>progresso real</b> com o <b>esperado pelo calendário</b>, com tolerância de <b>{t} pontos percentuais</b> (p.p.) para cada lado.</p>
            <table className="help-t">
              <tbody>
                <tr><td><span className="badge b-ahead">Acima do ritmo</span></td><td>real &gt; esperado + {t} p.p.</td></tr>
                <tr><td><span className="badge b-ok">No ritmo</span></td><td>diferença entre −{t} e +{t} p.p. (inclusive)</td></tr>
                <tr><td><span className="badge b-late">Atrasada</span></td><td>real &lt; esperado − {t} p.p.</td></tr>
                <tr><td><span className="badge b-closed">Fechada</span></td><td>sprint marcada como fechada no Taiga (não é comparada)</td></tr>
              </tbody>
            </table>
            <p className="help-now">
              <b>Nesta sprint ({info.sprint}):</b>{" "}
              {info.closed || info.expected == null
                ? <>sprint fechada — progresso final de <b>{info.progress}%</b>.</>
                : <>real <b>{info.progress}%</b> · esperado <b>{info.expected}%</b> · diferença <b>{sign(info.diff)} p.p.</b> → <b>{LABEL[info.state]}</b>.</>}
            </p>
          </section>

          <section>
            <h4 className="sec">Progresso real e esperado</h4>
            <ul>
              <li><b>Real:</b> {info.hasPoints
                ? <>pontos das user stories <b>concluídas</b> ÷ pontos totais da sprint.</>
                : <>user stories concluídas ÷ total de stories (esta sprint não tem pontos).</>}{" "}
                Uma story só conta quando <b>fecha inteira</b>; por isso o progresso costuma subir em degraus.</li>
              <li><b>Esperado:</b> fração dos dias da sprint que já passaram, de forma linear, do primeiro ao último dia. Fins de semana e feriados contam como dias normais.</li>
            </ul>
          </section>

          <section>
            <h4 className="sec">Cards dos desenvolvedores</h4>
            <ul>
              <li><b>Quem aparece:</b> {info.roles
                ? <>membros do projeto com os papéis <i>{info.roles.join(", ")}</i> (ativos, tendo ou não atividade na sprint). Pessoas de outros papéis, ou que não são mais do projeto, não ganham card, mas o trabalho delas continua nos totais da sprint.</>
                : <>todos os membros ativos do projeto, tendo ou não atividade na sprint, e quem tem itens na sprint.</>}</li>
              <li><b>Anel de progresso:</b> pontos concluídos ÷ pontos das stories de que a pessoa é responsável. Se ela não tem pontos, usa tasks concluídas ÷ tasks. Passe o mouse no anel para ver a base usada.</li>
              <li><b>Stories com mais de um responsável</b> têm os pontos divididos igualmente entre eles.</li>
              <li><b>Em aberto:</b> tasks abertas + stories abertas em que a pessoa é responsável.</li>
              <li><b>Tasks:</b> concluídas ÷ total das tasks atribuídas à pessoa na sprint.</li>
            </ul>
          </section>

          <section>
            <h4 className="sec">Impedimento 🚧</h4>
            <p>O card ganha a faixa vermelha quando a pessoa atua em uma story <b>aberta</b> que está:</p>
            <ul>
              <li>com um <b>status de impedimento</b> (nome que combine com <code>{info.blockedPattern}</code>, sem diferenciar maiúsculas); ou</li>
              <li><b>bloqueada</b> no Taiga (opção “Bloquear”).</li>
            </ul>
            <p>Vale para quem é responsável pela story <b>e</b> para quem só tem tasks nela. A dica ao passar o mouse lista as stories e os motivos.</p>
          </section>

          <section>
            <h4 className="sec">Sem responsável</h4>
            <p>Soma das user stories e das tasks da sprint que <b>ninguém assumiu</b>. Clique no card para ver a lista. Uma story sem responsável conta mesmo que suas tasks tenham dono.</p>
          </section>

          <section>
            <h4 className="sec">Burndown</h4>
            <p>Vem direto do Taiga: pontos <b>em aberto</b> a cada dia, contra a <b>linha ideal</b> (do total até zero no último dia). O resumo mostra quantos pontos a sprint está acima ou abaixo do ideal hoje.</p>
          </section>
        </div>
      </div>
    </dialog>
  );
}

/** Ícone “?” discreto que abre a explicação dos critérios. */
export function CriteriaHelp({ info }: { info: HelpInfo }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="help-btn" onClick={() => setOpen(true)} aria-label="Como esses indicadores são calculados" title="Como esses indicadores são calculados">?</button>
      {open && createPortal(<Dialog info={info} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

export type KanbanHelpInfo = {
  days: number; staleDays: number; blockedPattern: string; roles: string[] | null;
  doneTotal: number; fetched: number; ordered: boolean; partial: boolean;
};

function KanbanDialog({ info, onClose }: { info: KanbanHelpInfo; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} className="modal sm help" onClose={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
      <div className="modal-in">
        <header className="m-head">
          <div className="m-title"><p className="muted">Ajuda · Kanban</p><h3 className="modal-t">Como os indicadores do Kanban são calculados</h3></div>
          <div className="m-actions"><button className="modal-x ghost" onClick={() => ref.current?.close()} aria-label="Fechar">✕</button></div>
        </header>
        <div className="m-body help-body">
          <section>
            <h4 className="sec">Quadro</h4>
            <ul>
              <li><b>Fila:</b> a primeira coluna aberta (ex.: Novo). <b>Em andamento:</b> as demais colunas abertas, incluindo Impedimento.</li>
              <li>Colunas concluídas e arquivadas mostram só o <b>total</b>, lido do próprio Taiga sem baixar todos os itens.</li>
              <li>O <b>limite de WIP</b> aparece quando configurado na coluna do Taiga; passando dele, a coluna fica em vermelho.</li>
            </ul>
          </section>
          <section>
            <h4 className="sec">Indicadores</h4>
            <ul>
              <li><b>Parados:</b> itens em andamento sem nenhuma alteração há {info.staleDays}+ dias (data da última modificação; impedidos são contados à parte).</li>
              <li><b>Impedidos:</b> status com nome que combine com <code>{info.blockedPattern}</code> ou story bloqueada no Taiga.</li>
              <li><b>Concluídos:</b> itens com data de conclusão nos últimos {info.days} dias, e a comparação com os {info.days} dias anteriores.</li>
              <li><b>Tempo de entrega:</b> da criação à conclusão, dos itens concluídos no período. A <b>mediana</b> é o valor típico; o <b>p85</b> indica que 85% dos itens entregam em até esse tempo.</li>
              <li><b>Vazão semanal:</b> concluídos por semana; a linha tracejada é a média do período.</li>
            </ul>
          </section>
          <section>
            <h4 className="sec">Por desenvolvedor</h4>
            <p>{info.roles ? <>Membros ativos com os papéis <i>{info.roles.join(", ")}</i>.</> : <>Todos os membros ativos.</>} Pontos só aparecem quando as stories têm pontos; stories com mais de um responsável dividem os pontos.</p>
          </section>
          <section>
            <h4 className="sec">Limites dos dados</h4>
            <p>Para não sobrecarregar o Taiga, dos <b>{info.doneTotal}</b> itens concluídos são analisados os <b>{info.fetched}</b> {info.ordered ? "mais recentes" : "primeiros devolvidos"} (até 500), e o resultado fica guardado por 10 minutos. {info.partial ? "Se o período escolhido for maior do que essa amostra cobre, a página avisa." : "Nesta consulta, todos foram analisados."}</p>
          </section>
        </div>
      </div>
    </dialog>
  );
}

export function KanbanHelp({ info }: { info: KanbanHelpInfo }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="help-btn" onClick={() => setOpen(true)} aria-label="Como esses indicadores são calculados" title="Como esses indicadores são calculados">?</button>
      {open && createPortal(<KanbanDialog info={info} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
