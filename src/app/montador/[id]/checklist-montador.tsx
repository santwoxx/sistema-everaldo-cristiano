import { Check, Plus } from "lucide-react";
import { adicionarChecklist, alternarChecklist } from "@/app/actions/ordens";

type Item = { id: string; descricao: string; concluido: boolean };

/**
 * Checklist com alvos de toque grandes — o montador usa em pé, no local,
 * muitas vezes com uma das mãos ocupada.
 */
export function ChecklistMontador({
  ordemId,
  itens,
  feitos,
}: {
  ordemId: string;
  itens: Item[];
  feitos: number;
}) {
  const progresso = itens.length > 0 ? (feitos / itens.length) * 100 : 0;

  return (
    <section className="cartao p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold text-texto">Checklist de execução</h2>
        <span className="text-sm font-bold text-marca-600">
          {feitos}/{itens.length}
        </span>
      </div>

      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#eef2f0]">
        <span
          className="block h-full rounded-full bg-marca-500 transition-all duration-300"
          style={{ width: `${progresso}%` }}
        />
      </div>

      <ul className="mt-3 space-y-1.5">
        {itens.map((item) => (
          <li key={item.id}>
            <form action={alternarChecklist}>
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  item.concluido
                    ? "border-marca-200 bg-marca-50"
                    : "border-borda bg-white active:bg-[#f7f9f8]"
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition-colors ${
                    item.concluido
                      ? "border-marca-500 bg-marca-500 text-white"
                      : "border-borda bg-white"
                  }`}
                >
                  {item.concluido && <Check size={14} strokeWidth={3} />}
                </span>
                <span
                  className={`text-sm leading-snug ${
                    item.concluido ? "text-marca-800" : "text-texto"
                  }`}
                >
                  {item.descricao}
                </span>
              </button>
            </form>
          </li>
        ))}
      </ul>

      <form action={adicionarChecklist} className="mt-3 flex gap-2">
        <input type="hidden" name="ordemId" value={ordemId} />
        <input
          name="descricao"
          required
          placeholder="Adicionar etapa"
          className="campo"
          aria-label="Nova etapa"
        />
        <button type="submit" className="btn btn-claro shrink-0 !px-3">
          <Plus size={16} />
        </button>
      </form>
    </section>
  );
}
