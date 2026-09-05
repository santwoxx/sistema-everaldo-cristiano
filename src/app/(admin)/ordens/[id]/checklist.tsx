import { Check, Plus, Trash2 } from "lucide-react";
import { Painel } from "@/components/ui";
import {
  adicionarChecklist,
  alternarChecklist,
  removerChecklist,
} from "@/app/actions/ordens";

type Item = { id: string; descricao: string; concluido: boolean };

export function ChecklistOrdem({
  ordemId,
  itens,
  concluidos,
}: {
  ordemId: string;
  itens: Item[];
  concluidos: number;
}) {
  const progresso = itens.length > 0 ? (concluidos / itens.length) * 100 : 0;

  return (
    <Painel
      titulo="Checklist de execução"
      descricao={`${concluidos} de ${itens.length} etapas concluídas pelo montador`}
      acoes={
        <span className="text-sm font-bold text-marca-600">
          {Math.round(progresso)}%
        </span>
      }
    >
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#eef2f0]">
        <span
          className="block h-full rounded-full bg-marca-500 transition-all"
          style={{ width: `${progresso}%` }}
        />
      </div>

      <ul className="space-y-1">
        {itens.map((item) => (
          <li key={item.id} className="group flex items-center gap-2">
            <form action={alternarChecklist} className="flex min-w-0 flex-1">
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#f7f9f8]"
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                    item.concluido
                      ? "border-marca-500 bg-marca-500 text-white"
                      : "border-borda bg-white"
                  }`}
                >
                  {item.concluido && <Check size={13} strokeWidth={3} />}
                </span>
                <span
                  className={`min-w-0 text-sm ${
                    item.concluido ? "text-suave line-through" : "text-texto"
                  }`}
                >
                  {item.descricao}
                </span>
              </button>
            </form>

            <form action={removerChecklist} className="opacity-0 transition-opacity group-hover:opacity-100">
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                aria-label={`Remover etapa ${item.descricao}`}
                className="btn btn-fantasma !p-1.5 hover:!text-rose-600"
              >
                <Trash2 size={13} />
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
          placeholder="Adicionar etapa ao checklist"
          className="campo"
          aria-label="Nova etapa do checklist"
        />
        <button type="submit" className="btn btn-claro shrink-0">
          <Plus size={15} />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </form>
    </Painel>
  );
}
