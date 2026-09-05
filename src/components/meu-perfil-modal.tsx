"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Save, User } from "lucide-react";
import { Aviso, BotaoEnviar, Campo, Modal } from "@/components/form";
import { InputFoto } from "@/components/input-foto";
import { atualizarMeuPerfil } from "@/app/actions/equipe";
import type { Sessao } from "@/lib/auth";
import type { EstadoForm } from "@/app/actions/clientes";

export function MeuPerfilModal({
  sessao,
  aberto,
  aoFechar,
}: {
  sessao: Sessao;
  aberto: boolean;
  aoFechar: () => void;
}) {
  const router = useRouter();
  const [estado, acao] = useActionState<EstadoForm, FormData>(atualizarMeuPerfil, {});

  useEffect(() => {
    if (estado.sucesso) {
      const t = setTimeout(() => {
        aoFechar();
        router.refresh();
      }, 800);
      return () => clearTimeout(t);
    }
  }, [estado.sucesso, aoFechar, router]);

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Meu Perfil"
      descricao="Atualize seus dados pessoais, foto de perfil e senha de acesso."
      icone={<User size={20} />}
      largura="max-w-lg"
    >
      <form action={acao} className="space-y-4">
        {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
        {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}

        {/* Foto do perfil */}
        <div className="rounded-2xl border border-borda bg-slate-50/70 p-4">
          <label className="etiqueta mb-2 block font-semibold text-texto">
            Sua Foto de Perfil
          </label>
          <InputFoto
            nome="foto"
            valorInicial={sessao.foto}
            nomeUsuario={sessao.nome}
            corAvatar={sessao.corAvatar}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome completo" obrigatorio className="sm:col-span-2">
            <input
              name="nome"
              required
              defaultValue={sessao.nome}
              placeholder="Seu nome"
              className="campo"
            />
          </Campo>

          <Campo rotulo="E-mail de acesso" className="sm:col-span-2">
            <input
              value={sessao.email}
              disabled
              className="campo bg-slate-100 text-suave cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-suave">
              O e-mail é a sua chave de login.
            </p>
          </Campo>

          <Campo rotulo="Telefone / WhatsApp" className="sm:col-span-2">
            <input
              name="telefone"
              inputMode="tel"
              placeholder="(11) 99999-9999"
              className="campo"
            />
          </Campo>
        </div>

        <div className="rounded-2xl border border-borda bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-suave" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-suave">
              Alterar Senha (Opcional)
            </h4>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Nova senha">
              <input
                name="senha"
                type="password"
                minLength={6}
                autoComplete="new-password"
                placeholder="Mínimo 6 dígitos"
                className="campo"
              />
            </Campo>

            <Campo rotulo="Confirmar nova senha">
              <input
                name="confirmarSenha"
                type="password"
                minLength={6}
                autoComplete="new-password"
                placeholder="Repita a senha"
                className="campo"
              />
            </Campo>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-borda">
          <button type="button" onClick={aoFechar} className="btn btn-fantasma">
            Cancelar
          </button>
          <BotaoEnviar icone={<Save size={15} />}>
            Salvar alterações
          </BotaoEnviar>
        </div>
      </form>
    </Modal>
  );
}
