import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  dbLancamentos,
  dbUsuarios,
  dbNotificacoes,
  dbOrdens,
} from "@/lib/firestore";
import { desempenhoMontadores, evolucaoMensal, resumoFinanceiro } from "@/lib/financeiro";
import { moeda, porcentagem } from "@/lib/format";
import { CartaoIndicador, FaixaDestaque, Painel } from "@/components/ui";
import { NovoLancamento } from "./novo-lancamento";
import { Extrato } from "./extrato";
import { GraficoEvolucao } from "./grafico-evolucao";
import { DistribuicaoFaturamento } from "./distribuicao";
import { PainelEquipe } from "./painel-equipe";
import { Notificacoes } from "./notificacoes";

export const metadata: Metadata = { title: "Painel Financeiro" };
export const dynamic = "force-dynamic";

type Busca = { filtro?: string; pagina?: string };

export default async function PaginaPainel({
  searchParams,
}: {
  searchParams: Promise<Busca>;
}) {
  const { filtro = "todos", pagina = "1" } = await searchParams;

  const porPagina = 12;
  const paginaAtual = Math.max(1, Number(pagina) || 1);

  const [resumo, evolucao, equipe, todosLancamentos, montadores, notificacoes, todasOrdens, todosUsuarios] =
    await Promise.all([
      resumoFinanceiro(),
      evolucaoMensal(6),
      desempenhoMontadores(),
      dbLancamentos.listar(),
      dbUsuarios.listar({ papel: "MONTADOR", ativo: true }),
      dbNotificacoes.listar(6),
      dbOrdens.listar(),
      dbUsuarios.listar(),
    ]);

  let filtrados = todosLancamentos;
  if (filtro === "receitas") filtrados = todosLancamentos.filter((l) => l.tipo === "RECEITA");
  if (filtro === "despesas") filtrados = todosLancamentos.filter((l) => l.tipo === "DESPESA");

  const totalFiltrado = filtrados.length;
  const totalTodos = todosLancamentos.length;
  const totalReceitas = todosLancamentos.filter((l) => l.tipo === "RECEITA").length;
  const totalDespesas = todosLancamentos.filter((l) => l.tipo === "DESPESA").length;

  const inicio = (paginaAtual - 1) * porPagina;
  const lancamentosPaginados = filtrados.slice(inicio, inicio + porPagina);

  const ordensMap = new Map(todasOrdens.map((o) => [o.id, o]));
  const usuariosMap = new Map(todosUsuarios.map((u) => [u.id, u]));

  return (
    <>
      <FaixaDestaque
        chip="Gestão Financeira & Operacional"
        contexto="EC Montagens de Móveis"
        titulo="Fluxo de Caixa & Lucratividade"
        descricao="Visão consolidada de entradas, despesas operacionais e comissões dos montadores"
        acao={<NovoLancamento montadores={montadores.map((m) => ({ id: m.id, nome: m.nome }))} />}
      />

      {/* Indicadores */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CartaoIndicador
          rotulo="Faturamento confirmado"
          valor={moeda(resumo.faturamentoConfirmado)}
          nota="Entradas confirmadas"
          acento="verde"
          icone={<TrendingUp size={17} />}
        />
        <CartaoIndicador
          rotulo="A receber (pendentes)"
          valor={moeda(resumo.aReceber)}
          nota="Aguardando quitação"
          acento="ambar"
          icone={<Clock size={17} />}
        />
        <CartaoIndicador
          rotulo="Despesas operacionais"
          valor={moeda(resumo.despesasOperacionais)}
          nota={`Inclui ${moeda(resumo.comissoes)} em comissões`}
          acento="vermelho"
          icone={<TrendingDown size={17} />}
        />
        <CartaoIndicador
          rotulo="Lucro líquido"
          valor={moeda(resumo.lucroLiquido)}
          nota={`Margem líq. de ${porcentagem(Math.round(resumo.margem))}`}
          acento="esmeralda"
          icone={<PiggyBank size={17} />}
        />
      </div>

      <DistribuicaoFaturamento resumo={resumo} />

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Painel
          titulo="Evolução dos últimos 6 meses"
          descricao="Receitas confirmadas x despesas totais por mês"
        >
          <GraficoEvolucao dados={evolucao} />
        </Painel>

        <PainelEquipe equipe={equipe} />
      </div>

      <Extrato
        lancamentos={lancamentosPaginados.map((l) => {
          const ordem = l.ordemId ? ordensMap.get(l.ordemId) : null;
          const montador = l.montadorId ? usuariosMap.get(l.montadorId) : null;
          return {
            id: l.id,
            tipo: l.tipo,
            categoria: l.categoria,
            descricao: l.descricao,
            valor: l.valor,
            data: l.data,
            status: l.status,
            formaPagamento: l.formaPagamento,
            automatico: l.automatico,
            montador: montador?.nome ?? null,
            ordemId: ordem?.id ?? null,
            ordemNumero: ordem?.numero ?? null,
          };
        })}
        filtro={filtro}
        pagina={paginaAtual}
        totalPaginas={Math.max(1, Math.ceil(totalFiltrado / porPagina))}
        contagens={{
          todos: totalTodos,
          receitas: totalReceitas,
          despesas: totalDespesas,
        }}
        montadores={montadores.map((m) => ({ id: m.id, nome: m.nome }))}
      />

      <div id="notificacoes" className="scroll-mt-24">
        <Notificacoes
          itens={notificacoes.map((n) => ({
            id: n.id,
            tipo: n.tipo,
            titulo: n.titulo,
            mensagem: n.mensagem,
            link: n.link ?? null,
            lida: n.lida,
            criadoEm: n.criadoEm,
          }))}
        />
      </div>

      {/* Atalhos */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Atalho
          href="/ordens"
          icone={<Receipt size={17} />}
          titulo="Ordens de serviço"
          texto="Agende, acompanhe a execução e confira as assinaturas."
        />
        <Atalho
          href="/orcamentos"
          icone={<Wallet size={17} />}
          titulo="Orçamentos recebidos"
          texto="Responda os pedidos que chegaram pelo link do cliente."
        />
        <Atalho
          href="/links"
          icone={<TrendingUp size={17} />}
          titulo="Link para cliente"
          texto="Gere e envie o formulário de orçamento por WhatsApp."
        />
      </div>
    </>
  );
}

function Atalho({
  href,
  icone,
  titulo,
  texto,
}: {
  href: string;
  icone: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <Link
      href={href}
      className="cartao group flex items-start gap-3 p-4 transition-colors hover:border-marca-200 hover:bg-marca-50/40"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-marca-50 text-marca-600 transition-colors group-hover:bg-marca-500 group-hover:text-white">
        {icone}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-texto">{titulo}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-suave">{texto}</span>
      </span>
    </Link>
  );
}
