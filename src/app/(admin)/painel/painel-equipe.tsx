import Link from "next/link";
import { Users } from "lucide-react";
import { iniciais, moeda } from "@/lib/format";
import { Painel, Vazio } from "@/components/ui";

type Montador = {
  id: string;
  nome: string;
  corAvatar: string;
  ativo: boolean;
  concluidas: number;
  andamento: number;
  comissao: number;
  faturado: number;
};

export function PainelEquipe({ equipe }: { equipe: Montador[] }) {
  const maior = Math.max(...equipe.map((m) => m.faturado), 1);

  return (
    <Painel
      titulo="Produção por montador"
      descricao="Faturamento gerado e comissão acumulada"
      acoes={
        <Link href="/equipe" className="btn btn-fantasma !px-2 !py-1 !text-xs">
          Ver equipe
        </Link>
      }
    >
      {equipe.length === 0 ? (
        <Vazio
          icone={<Users size={20} />}
          titulo="Nenhum montador cadastrado"
          descricao="Cadastre a equipe para acompanhar produção e comissões."
          acao={
            <Link href="/equipe" className="btn btn-principal">
              Cadastrar montador
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {equipe.map((m) => (
            <li key={m.id}>
              <div className="flex items-center gap-3">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                  style={{ background: m.corAvatar }}
                >
                  {iniciais(m.nome)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-texto">
                      {m.nome}
                      {!m.ativo && (
                        <span className="ml-1.5 text-[10px] font-medium uppercase text-suave">
                          inativo
                        </span>
                      )}
                    </p>
                    <p className="shrink-0 text-sm font-bold text-texto">
                      {moeda(m.faturado)}
                    </p>
                  </div>

                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eef2f0]">
                    <span
                      className="block h-full rounded-full bg-marca-500"
                      style={{ width: `${Math.max((m.faturado / maior) * 100, m.faturado > 0 ? 4 : 0)}%` }}
                    />
                  </div>

                  <p className="mt-1.5 text-[11px] text-suave">
                    {m.concluidas} concluída{m.concluidas === 1 ? "" : "s"}
                    {m.andamento > 0 && ` · ${m.andamento} em aberto`} · comissão{" "}
                    {moeda(m.comissao)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}
