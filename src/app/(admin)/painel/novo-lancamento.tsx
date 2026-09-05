"use client";

import { useActionState, useEffect, useState } from "react";
import { PlusCircle, Save } from "lucide-react";
import {
  CATEGORIAS_DESPESA,
  CATEGORIAS_RECEITA,
  FORMAS_PAGAMENTO,
  STATUS_LANCAMENTO,
} from "@/lib/constants";
import { paraInputData } from "@/lib/format";
import { Aviso, BotaoEnviar, Campo, Modal } from "@/components/form";
import { salvarLancamento } from "@/app/actions/financeiro";
import type { EstadoForm } from "@/app/actions/clientes";
import type { LinhaExtrato } from "./extrato";

/** Botão que abre o formulário de lançamento (usado na faixa verde do painel). */
export function NovoLancamento({
  montadores,
}: {
  montadores: { id: string; nome: string }[];
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="btn bg-white text-marca-700 shadow-sm hover:bg-marca-50"
      >
        <PlusCircle size={16} /> Novo Lançamento
      </button>

      <FormularioLancamento
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        montadores={montadores}
      />
    </>
  );
}

export function FormularioLancamento({
  aberto,
  aoFechar,
  montadores,
  inicial,
}: {
  aberto: boolean;
  aoFechar: () => void;
  montadores: { id: string; nome: string }[];
  inicial?: LinhaExtrato;
}) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(salvarLancamento, {});
  const [tipo, setTipo] = useState<"RECEITA" | "DESPESA">("DESPESA");

  useEffect(() => {
    if (aberto) setTipo((inicial?.tipo as "RECEITA" | "DESPESA") ?? "DESPESA");
  }, [aberto, inicial]);

  // Fecha assim que o servidor confirma o salvamento.
  useEffect(() => {
    if (estado.sucesso) {
      const t = setTimeout(aoFechar, 700);
      return () => clearTimeout(t);
    }
  }, [estado.sucesso, aoFechar]);

  const categorias = tipo === "RECEITA" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={inicial ? "Editar lançamento" : "Novo lançamento"}
      descricao="Registre entradas e saídas que não vêm de uma ordem de serviço."
    >
      <form action={acao} className="space-y-4">
        {inicial && <input type="hidden" name="id" value={inicial.id} />}
        {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
        {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}

        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2">
          {(["RECEITA", "DESPESA"] as const).map((t) => (
            <label
              key={t}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors ${
                tipo === t
                  ? t === "RECEITA"
                    ? "border-marca-500 bg-marca-50 text-marca-700"
                    : "border-rose-400 bg-rose-50 text-rose-700"
                  : "border-borda text-suave hover:bg-[#f7f9f8]"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={t}
                checked={tipo === t}
                onChange={() => setTipo(t)}
                className="sr-only"
              />
              {t === "RECEITA" ? "Entrada (receita)" : "Saída (despesa)"}
            </label>
          ))}
        </div>

        <Campo rotulo="Descrição" obrigatorio>
          <input
            name="descricao"
            required
            defaultValue={inicial?.descricao}
            placeholder="Ex.: Combustível dos atendimentos da semana"
            className="campo"
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Valor (R$)" obrigatorio>
            <input
              name="valor"
              required
              inputMode="decimal"
              defaultValue={inicial ? String(inicial.valor).replace(".", ",") : ""}
              placeholder="0,00"
              className="campo"
            />
          </Campo>

          <Campo rotulo="Data" obrigatorio>
            <input
              type="date"
              name="data"
              required
              defaultValue={paraInputData(inicial?.data ?? new Date())}
              className="campo"
            />
          </Campo>

          <Campo rotulo="Categoria" obrigatorio>
            <select
              name="categoria"
              required
              defaultValue={inicial?.categoria}
              key={tipo}
              className="campo"
            >
              {Object.entries(categorias).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Forma de pagamento">
            <select
              name="formaPagamento"
              defaultValue={inicial?.formaPagamento ?? "PIX"}
              className="campo"
            >
              {Object.entries(FORMAS_PAGAMENTO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Situação">
            <select
              name="status"
              defaultValue={inicial?.status ?? "CONFIRMADO"}
              className="campo"
            >
              {Object.entries(STATUS_LANCAMENTO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            rotulo="Montador vinculado"
            dica="Opcional — use para comissões e adiantamentos."
          >
            <select name="montadorId" defaultValue="" className="campo">
              <option value="">Nenhum</option>
              {montadores.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo rotulo="Observações">
          <textarea
            name="observacoes"
            rows={2}
            defaultValue={inicial ? undefined : ""}
            placeholder="Anotações internas sobre este lançamento"
            className="campo resize-none"
          />
        </Campo>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={aoFechar} className="btn btn-fantasma">
            Cancelar
          </button>
          <BotaoEnviar icone={<Save size={15} />}>
            {inicial ? "Salvar alterações" : "Registrar lançamento"}
          </BotaoEnviar>
        </div>
      </form>
    </Modal>
  );
}
