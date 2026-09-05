"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Eraser, RotateCcw } from "lucide-react";
import { limparParaProducao, restaurarDemonstracao } from "@/app/actions/demo";
import { Modal } from "@/components/form";

export function BotaoRestaurarDemo() {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-borda px-3 py-2.5 text-xs font-semibold text-suave transition-colors hover:bg-marca-50 hover:text-marca-700"
      >
        <RotateCcw size={14} /> Restaurar Demonstração
      </button>

      <Modal
        aberto={aberto}
        aoFechar={() => !pendente && setAberto(false)}
        titulo="Reiniciar a base de dados"
        descricao="Escolha como deseja recomeçar. Os dois caminhos apagam tudo o que existe hoje."
        largura="max-w-lg"
      >
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            Esta ação não pode ser desfeita. Ordens de serviço, assinaturas,
            clientes e lançamentos financeiros serão apagados. Você será
            desconectado e precisará entrar novamente.
          </p>

          <div className="space-y-3">
            <button
              type="button"
              disabled={pendente}
              onClick={() => iniciar(() => void restaurarDemonstracao())}
              className="w-full rounded-xl border border-borda p-4 text-left transition-colors hover:border-marca-200 hover:bg-marca-50 disabled:opacity-60"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-texto">
                <RotateCcw size={15} className="text-marca-500" />
                Restaurar dados de demonstração
              </span>
              <span className="mt-1 block text-xs text-suave">
                Recria clientes, montadores, ordens assinadas, orçamentos e
                lançamentos de exemplo — ideal para apresentar o sistema.
              </span>
            </button>

            <button
              type="button"
              disabled={pendente}
              onClick={() => iniciar(() => void limparParaProducao())}
              className="w-full rounded-xl border border-borda p-4 text-left transition-colors hover:border-rose-200 hover:bg-rose-50 disabled:opacity-60"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-texto">
                <Eraser size={15} className="text-rose-500" />
                Começar do zero (uso real)
              </span>
              <span className="mt-1 block text-xs text-suave">
                Apaga tudo e mantém apenas o acesso do administrador. Use quando
                a empresa for iniciar a operação de verdade.
              </span>
            </button>
          </div>

          {pendente && (
            <p className="text-center text-xs font-medium text-suave">
              Reiniciando a base…
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
