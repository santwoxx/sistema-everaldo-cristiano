import Link from "next/link";
import { Bell, CheckCheck, FileText, PenLine, Wallet, Wrench } from "lucide-react";
import { dataHora } from "@/lib/format";
import { Painel, Vazio } from "@/components/ui";
import { marcarTodasLidas } from "@/app/actions/notificacoes";

type Item = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida: boolean;
  criadoEm: string;
};

const ICONES: Record<string, { icone: React.ReactNode; cor: string }> = {
  ORCAMENTO: { icone: <FileText size={15} />, cor: "bg-sky-50 text-sky-600" },
  ASSINATURA: { icone: <PenLine size={15} />, cor: "bg-violet-50 text-violet-600" },
  OS_CONCLUIDA: { icone: <Wrench size={15} />, cor: "bg-marca-50 text-marca-600" },
  FINANCEIRO: { icone: <Wallet size={15} />, cor: "bg-amber-50 text-amber-600" },
};

export function Notificacoes({ itens }: { itens: Item[] }) {
  const naoLidas = itens.filter((i) => !i.lida).length;

  return (
    <Painel
      titulo="Atividade recente"
      descricao="Orçamentos recebidos, assinaturas e conclusões de serviço"
      acoes={
        naoLidas > 0 ? (
          <form action={marcarTodasLidas}>
            <button type="submit" className="btn btn-fantasma !px-2 !py-1 !text-xs">
              <CheckCheck size={14} /> Marcar todas como lidas
            </button>
          </form>
        ) : null
      }
    >
      {itens.length === 0 ? (
        <Vazio
          icone={<Bell size={20} />}
          titulo="Nenhuma atividade ainda"
          descricao="Assim que um cliente enviar um orçamento ou uma OS for assinada, o aviso aparece aqui."
        />
      ) : (
        <ul className="space-y-1">
          {itens.map((n) => {
            const visual = ICONES[n.tipo] ?? {
              icone: <Bell size={15} />,
              cor: "bg-slate-100 text-slate-600",
            };

            const conteudo = (
              <>
                <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${visual.cor}`}>
                  {visual.icone}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-texto">
                      {n.titulo}
                    </span>
                    {!n.lida && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-marca-500"
                        aria-label="Não lida"
                      />
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-suave">
                    {n.mensagem}
                  </span>
                  <span className="mt-1 block text-[11px] text-suave">
                    {dataHora(n.criadoEm)}
                  </span>
                </span>
              </>
            );

            return (
              <li key={n.id}>
                {n.link ? (
                  <Link
                    href={n.link}
                    className="flex gap-3 rounded-xl p-3 transition-colors hover:bg-marca-50/50"
                  >
                    {conteudo}
                  </Link>
                ) : (
                  <div className="flex gap-3 rounded-xl p-3">{conteudo}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Painel>
  );
}
