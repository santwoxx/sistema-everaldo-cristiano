import { moeda } from "@/lib/format";

type Ponto = { rotulo: string; receita: number; despesa: number };

/**
 * Gráfico de barras em CSS puro — sem biblioteca externa, para manter o
 * bundle leve e a renderização idêntica no servidor e no cliente.
 */
export function GraficoEvolucao({ dados }: { dados: Ponto[] }) {
  const teto = Math.max(...dados.flatMap((d) => [d.receita, d.despesa]), 1);
  const semDados = dados.every((d) => d.receita === 0 && d.despesa === 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
        <span className="flex items-center gap-1.5 text-suave">
          <span className="h-2 w-2 rounded-full bg-marca-500" aria-hidden />
          Receitas confirmadas
        </span>
        <span className="flex items-center gap-1.5 text-suave">
          <span className="h-2 w-2 rounded-full bg-rose-400" aria-hidden />
          Despesas
        </span>
      </div>

      {semDados ? (
        <p className="py-10 text-center text-xs text-suave">
          Ainda não há movimentações registradas nos últimos meses.
        </p>
      ) : (
        <div className="flex h-48 items-end justify-between gap-2 sm:gap-4">
          {dados.map((d) => (
            <div key={d.rotulo} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full items-end justify-center gap-1">
                <span
                  className="w-1/2 max-w-7 rounded-t-md bg-marca-500 transition-all"
                  style={{ height: `${Math.max((d.receita / teto) * 100, d.receita > 0 ? 3 : 0)}%` }}
                  title={`Receitas: ${moeda(d.receita)}`}
                />
                <span
                  className="w-1/2 max-w-7 rounded-t-md bg-rose-400 transition-all"
                  style={{ height: `${Math.max((d.despesa / teto) * 100, d.despesa > 0 ? 3 : 0)}%` }}
                  title={`Despesas: ${moeda(d.despesa)}`}
                />
              </div>
              <span className="text-[10px] font-semibold tracking-wide text-suave">
                {d.rotulo}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
