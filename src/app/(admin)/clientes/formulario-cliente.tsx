"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, Trash2, UserPlus } from "lucide-react";
import { ESTADOS_BR } from "@/lib/constants";
import { Aviso, BotaoEnviar, Campo, FormConfirmar, Modal } from "@/components/form";
import {
  excluirCliente,
  salvarCliente,
  type EstadoForm,
} from "@/app/actions/clientes";

export type ClienteInicial = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  documento: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  temOrdens: boolean;
};

export function FormularioCliente({ inicial }: { inicial?: ClienteInicial }) {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  const [estado, acao] = useActionState<EstadoForm, FormData>(salvarCliente, {});

  useEffect(() => {
    if (estado.sucesso) {
      const t = setTimeout(() => {
        setAberto(false);
        router.refresh();
      }, 700);
      return () => clearTimeout(t);
    }
  }, [estado.sucesso, router]);

  return (
    <>
      {inicial ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label={`Editar ${inicial.nome}`}
          className="btn btn-fantasma !p-1.5"
        >
          <Pencil size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="btn btn-principal"
        >
          <UserPlus size={16} /> Novo cliente
        </button>
      )}

      <Modal
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo={inicial ? "Editar cliente" : "Novo cliente"}
        descricao="Os dados de endereço são sugeridos automaticamente ao criar uma OS."
      >
        <form action={acao} className="space-y-4">
          {inicial && <input type="hidden" name="id" value={inicial.id} />}
          {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
          {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Nome / Razão social" obrigatorio className="sm:col-span-2">
              <input
                name="nome"
                required
                defaultValue={inicial?.nome}
                placeholder="Nome completo do cliente"
                className="campo"
              />
            </Campo>

            <Campo rotulo="Telefone / WhatsApp">
              <input
                name="telefone"
                defaultValue={inicial?.telefone ?? ""}
                inputMode="tel"
                placeholder="(11) 99999-9999"
                className="campo"
              />
            </Campo>

            <Campo rotulo="CPF / CNPJ">
              <input
                name="documento"
                defaultValue={inicial?.documento ?? ""}
                placeholder="000.000.000-00"
                className="campo"
              />
            </Campo>

            <Campo rotulo="E-mail" className="sm:col-span-2">
              <input
                name="email"
                type="email"
                defaultValue={inicial?.email ?? ""}
                placeholder="cliente@email.com"
                className="campo"
              />
            </Campo>
          </div>

          <fieldset className="rounded-xl border border-borda p-4">
            <legend className="px-1.5 text-xs font-bold uppercase tracking-wide text-suave">
              Endereço
            </legend>

            <div className="grid gap-4 sm:grid-cols-6">
              <Campo rotulo="CEP" className="sm:col-span-2">
                <input
                  name="cep"
                  defaultValue={inicial?.cep ?? ""}
                  inputMode="numeric"
                  placeholder="00000-000"
                  className="campo"
                />
              </Campo>

              <Campo rotulo="Logradouro" className="sm:col-span-4">
                <input
                  name="endereco"
                  defaultValue={inicial?.endereco ?? ""}
                  placeholder="Rua, avenida…"
                  className="campo"
                />
              </Campo>

              <Campo rotulo="Número" className="sm:col-span-2">
                <input
                  name="numero"
                  defaultValue={inicial?.numero ?? ""}
                  className="campo"
                />
              </Campo>

              <Campo rotulo="Complemento" className="sm:col-span-4">
                <input
                  name="complemento"
                  defaultValue={inicial?.complemento ?? ""}
                  placeholder="Apto, bloco, referência"
                  className="campo"
                />
              </Campo>

              <Campo rotulo="Bairro" className="sm:col-span-2">
                <input
                  name="bairro"
                  defaultValue={inicial?.bairro ?? ""}
                  className="campo"
                />
              </Campo>

              <Campo rotulo="Cidade" className="sm:col-span-3">
                <input
                  name="cidade"
                  defaultValue={inicial?.cidade ?? ""}
                  className="campo"
                />
              </Campo>

              <Campo rotulo="UF" className="sm:col-span-1">
                <select
                  name="estado"
                  defaultValue={inicial?.estado ?? ""}
                  className="campo"
                >
                  <option value="">—</option>
                  {ESTADOS_BR.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
          </fieldset>

          <Campo rotulo="Observações">
            <textarea
              name="observacoes"
              rows={2}
              defaultValue={inicial?.observacoes ?? ""}
              placeholder="Condições de pagamento, preferências, referências do local…"
              className="campo resize-none"
            />
          </Campo>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {inicial && !inicial.temOrdens ? (
              <FormConfirmar
                action={excluirCliente}
                mensagem={`Excluir o cliente ${inicial.nome}?`}
              >
                <input type="hidden" name="id" value={inicial.id} />
                <button type="submit" className="btn btn-perigo">
                  <Trash2 size={15} /> Excluir
                </button>
              </FormConfirmar>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="btn btn-fantasma"
              >
                Cancelar
              </button>
              <BotaoEnviar icone={<Save size={15} />}>
                {inicial ? "Salvar alterações" : "Cadastrar cliente"}
              </BotaoEnviar>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
