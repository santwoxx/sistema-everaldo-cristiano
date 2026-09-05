"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Save } from "lucide-react";
import { FORMAS_PAGAMENTO } from "@/lib/constants";
import { paraInputData } from "@/lib/format";
import { Aviso, BotaoEnviar, Campo, Modal } from "@/components/form";
import { salvarOrdem } from "@/app/actions/ordens";
import type { EstadoForm } from "@/app/actions/clientes";

type ClienteOpcao = {
  id: string;
  nome: string;
  endereco?: string | null;
  numero?: string | null;
  cidade?: string | null;
};

type MontadorOpcao = { id: string; nome: string; comissaoPadrao: number };

export type OrdemInicial = {
  id: string;
  titulo: string;
  descricao: string | null;
  clienteId: string;
  montadorId: string | null;
  endereco: string | null;
  cidade: string | null;
  dataAgendada: string | null;
  valorTotal: number;
  comissaoPercent: number;
  formaPagamento: string;
  observacoes: string | null;
  temItens: boolean;
};

export function FormularioOrdem({
  clientes,
  montadores,
  inicial,
  rotuloBotao,
}: {
  clientes: ClienteOpcao[];
  montadores: MontadorOpcao[];
  inicial?: OrdemInicial;
  /** Texto do botão que abre o formulário. Padrão: "Nova ordem de serviço". */
  rotuloBotao?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  const [estado, acao] = useActionState<EstadoForm, FormData>(salvarOrdem, {});

  const [clienteId, setClienteId] = useState(inicial?.clienteId ?? "");
  const [endereco, setEndereco] = useState(inicial?.endereco ?? "");
  const [cidade, setCidade] = useState(inicial?.cidade ?? "");
  const [comissao, setComissao] = useState(String(inicial?.comissaoPercent ?? 30));

  useEffect(() => {
    if (estado.sucesso) {
      const t = setTimeout(() => {
        setAberto(false);
        router.refresh();
      }, 700);
      return () => clearTimeout(t);
    }
  }, [estado.sucesso, router]);

  /** Ao escolher o cliente, o endereço do cadastro entra como sugestão. */
  function aoTrocarCliente(id: string) {
    setClienteId(id);
    const c = clientes.find((x) => x.id === id);
    if (!c || inicial) return;
    setEndereco([c.endereco, c.numero].filter(Boolean).join(", "));
    setCidade(c.cidade ?? "");
  }

  function aoTrocarMontador(id: string) {
    const m = montadores.find((x) => x.id === id);
    if (m && !inicial) setComissao(String(m.comissaoPadrao));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="btn btn-principal"
      >
        {!rotuloBotao && <PlusCircle size={16} />}
        {rotuloBotao ?? "Nova ordem de serviço"}
      </button>

      <Modal
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo={inicial ? "Editar ordem de serviço" : "Nova ordem de serviço"}
        descricao="O montador recebe a OS no app e coleta as assinaturas ao finalizar."
      >
        <form action={acao} className="space-y-4">
          {inicial && <input type="hidden" name="id" value={inicial.id} />}
          {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
          {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}

          <Campo rotulo="Serviço" obrigatorio>
            <input
              name="titulo"
              required
              defaultValue={inicial?.titulo}
              placeholder="Ex.: Montagem de guarda-roupa 6 portas"
              className="campo"
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Cliente" obrigatorio>
              <select
                name="clienteId"
                required
                value={clienteId}
                onChange={(e) => aoTrocarCliente(e.target.value)}
                className="campo"
              >
                <option value="">Selecione o cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo rotulo="Montador responsável">
              <select
                name="montadorId"
                defaultValue={inicial?.montadorId ?? ""}
                onChange={(e) => aoTrocarMontador(e.target.value)}
                className="campo"
              >
                <option value="">Definir depois</option>
                {montadores.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} · {m.comissaoPadrao}%
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo rotulo="Descrição do serviço">
            <textarea
              name="descricao"
              rows={3}
              defaultValue={inicial?.descricao ?? ""}
              placeholder="Detalhes que o montador precisa saber antes de ir ao local"
              className="campo resize-none"
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Campo rotulo="Endereço do atendimento">
              <input
                name="endereco"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número e complemento"
                className="campo"
              />
            </Campo>
            <Campo rotulo="Cidade">
              <input
                name="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="campo"
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Data agendada">
              <input
                type="date"
                name="dataAgendada"
                defaultValue={paraInputData(inicial?.dataAgendada)}
                className="campo"
              />
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

            <Campo
              rotulo="Valor do serviço (R$)"
              dica={
                inicial?.temItens
                  ? "Calculado pelos itens lançados na OS."
                  : "Você pode detalhar em itens depois de criar a OS."
              }
            >
              <input
                name="valorTotal"
                inputMode="decimal"
                readOnly={inicial?.temItens}
                defaultValue={
                  inicial ? String(inicial.valorTotal).replace(".", ",") : ""
                }
                placeholder="0,00"
                className="campo"
              />
            </Campo>

            <Campo rotulo="Comissão do montador (%)">
              <input
                name="comissaoPercent"
                inputMode="decimal"
                value={comissao}
                onChange={(e) => setComissao(e.target.value)}
                className="campo"
              />
            </Campo>
          </div>

          <Campo rotulo="Observações internas">
            <textarea
              name="observacoes"
              rows={2}
              defaultValue={inicial?.observacoes ?? ""}
              className="campo resize-none"
            />
          </Campo>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="btn btn-fantasma"
            >
              Cancelar
            </button>
            <BotaoEnviar icone={<Save size={15} />}>
              {inicial ? "Salvar alterações" : "Criar ordem de serviço"}
            </BotaoEnviar>
          </div>
        </form>
      </Modal>
    </>
  );
}
