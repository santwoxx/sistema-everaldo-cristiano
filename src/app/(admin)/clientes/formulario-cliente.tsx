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
  const [cep, setCep] = useState(inicial?.cep ?? "");
  const [endereco, setEndereco] = useState(inicial?.endereco ?? "");
  const [bairro, setBairro] = useState(inicial?.bairro ?? "");
  const [cidade, setCidade] = useState(inicial?.cidade ?? "");
  const [estadoUf, setEstadoUf] = useState(inicial?.estado ?? "");
  const [buscandoCep, setBuscandoCep] = useState(false);

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

  const buscarCep = async (valor: string) => {
    const limpo = valor.replace(/\D/g, "");
    setCep(valor);
    if (limpo.length === 8) {
      setBuscandoCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          if (data.logradouro) setEndereco(data.logradouro);
          if (data.bairro) setBairro(data.bairro);
          if (data.localidade) setCidade(data.localidade);
          if (data.uf) setEstadoUf(data.uf);
        }
      } catch {
        // Ignora erro de rede no viacep
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  return (
    <>
      {inicial ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label={`Editar ${inicial.nome}`}
          className="btn btn-fantasma !p-1.5 hover:text-marca-600"
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
        descricao="Cadastre ou atualize os contatos e endereços do cliente."
        icone={<UserPlus size={20} />}
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

          <fieldset className="rounded-xl border-2 border-slate-300 bg-slate-50/70 p-4">
            <legend className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-800 bg-white border border-slate-300 rounded-md">
              Endereço {buscandoCep && "(buscando CEP...)"}
            </legend>

            <div className="grid gap-4 sm:grid-cols-6">
              <Campo rotulo="CEP" className="sm:col-span-2">
                <input
                  name="cep"
                  value={cep}
                  onChange={(e) => buscarCep(e.target.value)}
                  inputMode="numeric"
                  placeholder="00000-000"
                  className="campo"
                />
              </Campo>

              <Campo rotulo="Logradouro" className="sm:col-span-4">
                <input
                  name="endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, avenida…"
                  className="campo"
                />
              </Campo>

              <Campo rotulo="Número" className="sm:col-span-2">
                <input
                  name="numero"
                  defaultValue={inicial?.numero ?? ""}
                  placeholder="123"
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
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Bairro"
                  className="campo"
                />
              </Campo>

              <Campo rotulo="Cidade" className="sm:col-span-3">
                <input
                  name="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Cidade"
                  className="campo"
                />
              </Campo>

              <Campo rotulo="UF" className="sm:col-span-1">
                <select
                  name="estado"
                  value={estadoUf}
                  onChange={(e) => setEstadoUf(e.target.value)}
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

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-borda">
            {inicial ? (
              <FormConfirmar
                action={excluirCliente}
                mensagem={`Excluir o cliente ${inicial.nome}?`}
              >
                <input type="hidden" name="id" value={inicial.id} />
                <button type="submit" className="btn btn-perigo">
                  <Trash2 size={15} /> Excluir cliente
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
