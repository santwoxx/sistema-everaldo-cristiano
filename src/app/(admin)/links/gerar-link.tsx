"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Sparkles } from "lucide-react";
import { Aviso, BotaoEnviar, Campo, Modal } from "@/components/form";
import { criarLink } from "@/app/actions/links";
import type { EstadoForm } from "@/app/actions/clientes";

export function GerarLink() {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  const [estado, acao] = useActionState<EstadoForm, FormData>(criarLink, {});

  useEffect(() => {
    if (estado.sucesso) {
      const t = setTimeout(() => {
        setAberto(false);
        router.refresh();
      }, 800);
      return () => clearTimeout(t);
    }
  }, [estado.sucesso, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="btn btn-principal"
      >
        <Link2 size={16} /> Gerar novo link
      </button>

      <Modal
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo="Gerar link para o cliente"
        descricao="Um endereço único que abre o formulário público de orçamento."
        largura="max-w-lg"
      >
        <form action={acao} className="space-y-4">
          {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
          {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}

          <Campo
            rotulo="Identificação do link"
            dica="Uso interno — ajuda a saber de onde veio cada orçamento."
          >
            <input
              name="titulo"
              defaultValue="Solicitação de Orçamento — EC Montagens"
              className="campo"
            />
          </Campo>

          <Campo
            rotulo="Mensagem exibida ao cliente"
            dica="Aparece no topo do formulário."
          >
            <textarea
              name="mensagem"
              rows={3}
              defaultValue="Preencha os dados do seu móvel e retornamos com o orçamento em até 24 horas úteis."
              className="campo resize-none"
            />
          </Campo>

          <Campo
            rotulo="Validade (dias)"
            dica="Deixe em branco para um link sem prazo de expiração."
          >
            <input
              name="validadeDias"
              inputMode="numeric"
              placeholder="Ex.: 30"
              className="campo"
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
            <BotaoEnviar icone={<Sparkles size={15} />}>Gerar link</BotaoEnviar>
          </div>
        </form>
      </Modal>
    </>
  );
}
