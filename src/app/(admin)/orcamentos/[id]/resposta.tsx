"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { STATUS_ORCAMENTO } from "@/lib/constants";
import { dataHora } from "@/lib/format";
import { Aviso, BotaoEnviar, Campo } from "@/components/form";
import { Painel } from "@/components/ui";
import { atualizarOrcamento } from "@/app/actions/orcamentos";
import type { EstadoForm } from "@/app/actions/clientes";

export function FormularioResposta({
  id,
  status,
  valorProposto,
  observacoesInternas,
  respondidoEm,
  convertido,
}: {
  id: string;
  status: string;
  valorProposto: number | null;
  observacoesInternas: string | null;
  respondidoEm: string | null;
  convertido: boolean;
}) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(
    atualizarOrcamento,
    {}
  );

  return (
    <Painel
      titulo="Resposta da EC Montagens"
      descricao="Registre o valor proposto e acompanhe a negociação"
    >
      <form action={acao} className="space-y-4">
        <input type="hidden" name="id" value={id} />

        {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
        {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}

        <Campo rotulo="Situação">
          <select name="status" defaultValue={status} className="campo">
            {Object.entries(STATUS_ORCAMENTO).map(([valor, rotulo]) => (
              <option key={valor} value={valor} disabled={valor === "CONVERTIDO" && !convertido}>
                {rotulo}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          rotulo="Valor proposto (R$)"
          dica="Usado como valor inicial ao converter em ordem de serviço."
        >
          <input
            name="valorProposto"
            inputMode="decimal"
            defaultValue={
              valorProposto ? String(valorProposto).replace(".", ",") : ""
            }
            placeholder="0,00"
            className="campo"
          />
        </Campo>

        <Campo rotulo="Observações internas">
          <textarea
            name="observacoesInternas"
            rows={5}
            defaultValue={observacoesInternas ?? ""}
            placeholder="Anotações da negociação, condições combinadas, materiais a levar…"
            className="campo resize-none"
          />
        </Campo>

        {respondidoEm && (
          <p className="text-[11px] text-suave">
            Última atualização em {dataHora(respondidoEm)}
          </p>
        )}

        <BotaoEnviar className="btn btn-principal w-full" icone={<Save size={15} />}>
          Salvar resposta
        </BotaoEnviar>
      </form>
    </Painel>
  );
}
