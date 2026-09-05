import { Plus, Trash2 } from "lucide-react";
import { moeda } from "@/lib/format";
import { Painel } from "@/components/ui";
import { adicionarItem, removerItem } from "@/app/actions/ordens";

type Item = {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
};

export function ItensOrdem({
  ordemId,
  itens,
  valorTotal,
  bloqueado,
}: {
  ordemId: string;
  itens: Item[];
  valorTotal: number;
  bloqueado: boolean;
}) {
  return (
    <Painel
      titulo="Itens do serviço"
      descricao="O valor da OS é a soma dos itens lançados aqui"
      semPadding
    >
      {itens.length > 0 && (
        <div className="overflow-x-auto">
          <table className="tabela min-w-[520px]">
            <thead>
              <tr>
                <th>Descrição</th>
                <th className="!text-center">Qtd.</th>
                <th className="!text-right">Unitário</th>
                <th className="!text-right">Subtotal</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.id}>
                  <td className="font-medium text-texto">{i.descricao}</td>
                  <td className="text-center text-suave">
                    {i.quantidade % 1 === 0 ? i.quantidade : i.quantidade.toFixed(2)}
                  </td>
                  <td className="text-right text-suave">{moeda(i.valorUnitario)}</td>
                  <td className="text-right font-semibold text-texto">
                    {moeda(i.quantidade * i.valorUnitario)}
                  </td>
                  <td className="text-right">
                    {!bloqueado && (
                      <form action={removerItem}>
                        <input type="hidden" name="id" value={i.id} />
                        <button
                          type="submit"
                          aria-label={`Remover ${i.descricao}`}
                          className="btn btn-fantasma !p-1.5 hover:!text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-borda">
                <td colSpan={3} className="px-4 py-3 text-right text-xs font-semibold text-suave">
                  Total do serviço
                </td>
                <td className="px-4 py-3 text-right text-base font-bold text-texto">
                  {moeda(valorTotal)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {bloqueado ? (
        itens.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-suave sm:px-5">
            Nenhum item detalhado nesta OS.
          </p>
        )
      ) : (
        <form
          action={adicionarItem}
          className="grid gap-2 border-t border-borda p-4 sm:grid-cols-[1fr_80px_120px_auto] sm:p-5"
        >
          <input type="hidden" name="ordemId" value={ordemId} />
          <input
            name="descricao"
            required
            placeholder="Descrição do item ou etapa"
            className="campo"
            aria-label="Descrição do item"
          />
          <input
            name="quantidade"
            inputMode="decimal"
            defaultValue="1"
            placeholder="Qtd."
            className="campo"
            aria-label="Quantidade"
          />
          <input
            name="valorUnitario"
            inputMode="decimal"
            placeholder="Valor un."
            className="campo"
            aria-label="Valor unitário"
          />
          <button type="submit" className="btn btn-claro">
            <Plus size={15} /> Adicionar
          </button>
        </form>
      )}
    </Painel>
  );
}
