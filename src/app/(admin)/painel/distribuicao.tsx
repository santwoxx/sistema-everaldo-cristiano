import { moeda } from "@/lib/format";
import type { ResumoFinanceiro } from "@/lib/financeiro";

/**
 * Barra empilhada que abre o faturamento confirmado em lucro, comissões
 * e demais despesas — o mesmo recorte usado no fechamento do mês.
 */
export function DistribuicaoFaturamento({ resumo }: { resumo: ResumoFinanceiro }) {
  const base = Math.max(
    resumo.faturamentoConfirmado,
    resumo.despesasOperacionais + Math.max(resumo.lucroLiquido, 0)
  );

  const fatias = [
    {
      chave: "lucro",
      rotulo: "Lucro Líquido",
      valor: Math.max(resumo.lucroLiquido, 0),
      cor: "bg-marca-500",
      ponto: "bg-marca-500",
    },
    {
      chave: "comissoes",
      rotulo: "Comissões Montadores",
      valor: resumo.comissoes,
      cor: "bg-amber-400",
      ponto: "bg-amber-400",
    },
    {
      chave: "despesas",
      rotulo: "Despesas Operacionais",
      valor: resumo.despesasSemComissao,
      cor: "bg-rose-500",
      ponto: "bg-rose-500",
    },
  ];

  const prejuizo = resumo.lucroLiquido < 0;

  return (
    <section className="cartao p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold tracking-tight text-texto">
            Distribuição do Faturamento
          </h3>
          <p className="mt-0.5 text-xs text-suave">
            Comparativo visual entre receitas confirmadas e custos operacionais
          </p>
        </div>
        <p className="text-sm font-semibold">
          <span className="text-suave">Lucro Real: </span>
          <span className={prejuizo ? "text-rose-600" : "text-marca-600"}>
            {moeda(resumo.lucroLiquido)}
          </span>
        </p>
      </div>

      <div
        className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-[#eef2f0]"
        role="img"
        aria-label={`Lucro ${moeda(resumo.lucroLiquido)}, comissões ${moeda(resumo.comissoes)}, despesas ${moeda(resumo.despesasSemComissao)}`}
      >
        {base > 0 &&
          fatias.map((f) => {
            const largura = (f.valor / base) * 100;
            if (largura <= 0) return null;
            return (
              <span
                key={f.chave}
                className={f.cor}
                style={{ width: `${largura}%` }}
                title={`${f.rotulo}: ${moeda(f.valor)}`}
              />
            );
          })}
      </div>

      <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        {fatias.map((f) => (
          <li key={f.chave} className="flex items-center gap-2 text-xs text-suave">
            <span className={`h-2 w-2 rounded-full ${f.ponto}`} aria-hidden />
            <span className="font-medium text-texto">{f.rotulo}</span>
            <span>({moeda(f.valor)})</span>
          </li>
        ))}
      </ul>

      {prejuizo && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
          As despesas do período superaram o faturamento confirmado em{" "}
          {moeda(Math.abs(resumo.lucroLiquido))}. Confira os lançamentos pendentes de
          recebimento no extrato.
        </p>
      )}
    </section>
  );
}
