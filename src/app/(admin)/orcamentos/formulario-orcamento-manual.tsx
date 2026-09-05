"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus, Save } from "lucide-react";
import { TIPOS_SERVICO } from "@/lib/constants";
import { Aviso, BotaoEnviar, Campo, Modal } from "@/components/form";
import { criarOrcamentoManual } from "@/app/actions/orcamentos";
import type { EstadoForm } from "@/app/actions/clientes";

export function FormularioOrcamentoManual({
  clientes = [],
}: {
  clientes?: Array<{ id: string; nome: string; telefone: string | null; cidade: string | null }>;
}) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const router = useRouter();

  const [estado, acao] = useActionState<EstadoForm, FormData>(criarOrcamentoManual, {});

  useEffect(() => {
    if (estado.sucesso) {
      const t = setTimeout(() => {
        setAberto(false);
        setNome("");
        setTelefone("");
        setCidade("");
        router.refresh();
      }, 700);
      return () => clearTimeout(t);
    }
  }, [estado.sucesso, router]);

  const selecionarCliente = (clienteId: string) => {
    const c = clientes.find((item) => item.id === clienteId);
    if (c) {
      setNome(c.nome);
      if (c.telefone) setTelefone(c.telefone);
      if (c.cidade) setCidade(c.cidade);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="btn btn-principal"
      >
        <FilePlus size={16} /> Novo orçamento
      </button>

      <Modal
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo="Novo Orçamento"
        descricao="Cadastre uma proposta ou solicitação recebida por telefone/WhatsApp."
        icone={<FilePlus size={20} />}
      >
        <form action={acao} className="space-y-4">
          {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
          {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}

          {clientes.length > 0 && (
            <Campo rotulo="Preencher a partir de cliente existente (opcional)">
              <select
                onChange={(e) => selecionarCliente(e.target.value)}
                className="campo"
                defaultValue=""
              >
                <option value="">— Selecione um cliente cadastrado ou digite abaixo —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.telefone ? `(${c.telefone})` : ""}
                  </option>
                ))}
              </select>
            </Campo>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Nome do cliente / Contato" obrigatorio>
              <input
                name="nomeContato"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva"
                className="campo"
              />
            </Campo>

            <Campo rotulo="Telefone / WhatsApp" obrigatorio>
              <input
                name="telefone"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                inputMode="tel"
                placeholder="(11) 99999-9999"
                className="campo"
              />
            </Campo>

            <Campo rotulo="Tipo de serviço" obrigatorio>
              <select name="tipoServico" defaultValue="MONTAGEM" className="campo">
                {Object.entries(TIPOS_SERVICO).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo rotulo="Quantidade de itens">
              <input
                name="quantidadeItens"
                type="number"
                min={1}
                defaultValue={1}
                className="campo"
              />
            </Campo>

            <Campo rotulo="Cidade / Região">
              <input
                name="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Ex: São Paulo"
                className="campo"
              />
            </Campo>

            <Campo rotulo="Prazo desejado">
              <input name="prazoDesejado" type="date" className="campo" />
            </Campo>

            <Campo rotulo="Valor proposto (R$)" dica="Deixe em branco se ainda for avaliar">
              <input
                name="valorProposto"
                placeholder="Ex: 450,00"
                className="campo"
              />
            </Campo>

            <Campo rotulo="E-mail (opcional)">
              <input
                name="email"
                type="email"
                placeholder="cliente@email.com"
                className="campo"
              />
            </Campo>
          </div>

          <Campo rotulo="Descrição dos móveis / serviço" obrigatorio>
            <textarea
              name="descricao"
              rows={3}
              required
              placeholder="Ex: Montagem de guarda-roupa 6 portas com espelho e 1 cômoda..."
              className="campo resize-none"
            />
          </Campo>

          <Campo rotulo="Observações internas (visível apenas para a empresa)">
            <textarea
              name="observacoesInternas"
              rows={2}
              placeholder="Ex: Cliente prefere atendimento aos sábados pela manhã."
              className="campo resize-none"
            />
          </Campo>

          <div className="flex justify-end gap-2 pt-2 border-t border-borda">
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="btn btn-fantasma"
            >
              Cancelar
            </button>
            <BotaoEnviar icone={<Save size={15} />}>
              Criar orçamento
            </BotaoEnviar>
          </div>
        </form>
      </Modal>
    </>
  );
}
