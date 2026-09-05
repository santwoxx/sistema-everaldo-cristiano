"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, Trash2, UserPlus } from "lucide-react";
import { Aviso, BotaoEnviar, Campo, FormConfirmar, Modal } from "@/components/form";
import { excluirUsuario, salvarUsuario } from "@/app/actions/equipe";
import type { EstadoForm } from "@/app/actions/clientes";

export type UsuarioInicial = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  telefone: string | null;
  documento: string | null;
  comissaoPadrao: number;
  ativo: boolean;
};

export function FormularioUsuario({ inicial }: { inicial?: UsuarioInicial }) {
  const [aberto, setAberto] = useState(false);
  const [papel, setPapel] = useState(inicial?.papel ?? "MONTADOR");
  const router = useRouter();
  const [estado, acao] = useActionState<EstadoForm, FormData>(salvarUsuario, {});

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
          <UserPlus size={16} /> Novo acesso
        </button>
      )}

      <Modal
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo={inicial ? "Editar acesso" : "Novo acesso"}
        descricao="Administradores gerenciam o sistema; montadores usam o app de campo."
        largura="max-w-xl"
      >
        <form action={acao} className="space-y-4">
          {inicial && <input type="hidden" name="id" value={inicial.id} />}
          {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
          {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}

          {/* Perfil */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { valor: "MONTADOR", rotulo: "Montador", nota: "App de campo" },
              { valor: "ADMIN", rotulo: "Administrador", nota: "Acesso total" },
            ].map((opcao) => (
              <label
                key={opcao.valor}
                className={`cursor-pointer rounded-xl border-2 px-3 py-2.5 text-center transition-colors ${
                  papel === opcao.valor
                    ? "border-marca-500 bg-marca-50"
                    : "border-borda hover:bg-[#f7f9f8]"
                }`}
              >
                <input
                  type="radio"
                  name="papel"
                  value={opcao.valor}
                  checked={papel === opcao.valor}
                  onChange={() => setPapel(opcao.valor)}
                  className="sr-only"
                />
                <span
                  className={`block text-sm font-semibold ${
                    papel === opcao.valor ? "text-marca-700" : "text-texto"
                  }`}
                >
                  {opcao.rotulo}
                </span>
                <span className="block text-[10px] text-suave">{opcao.nota}</span>
              </label>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Nome completo" obrigatorio className="sm:col-span-2">
              <input
                name="nome"
                required
                defaultValue={inicial?.nome}
                className="campo"
              />
            </Campo>

            <Campo rotulo="E-mail de acesso" obrigatorio className="sm:col-span-2">
              <input
                name="email"
                type="email"
                required
                defaultValue={inicial?.email}
                autoComplete="off"
                placeholder="nome@ecmontagens.com.br"
                className="campo"
              />
            </Campo>

            <Campo
              rotulo={inicial ? "Nova senha" : "Senha"}
              obrigatorio={!inicial}
              dica={
                inicial
                  ? "Deixe em branco para manter a senha atual."
                  : "Mínimo de 6 caracteres."
              }
            >
              <input
                name="senha"
                type="password"
                required={!inicial}
                minLength={inicial ? 0 : 6}
                autoComplete="new-password"
                placeholder={inicial ? "••••••••" : "Defina uma senha"}
                className="campo"
              />
            </Campo>

            <Campo rotulo="Telefone">
              <input
                name="telefone"
                defaultValue={inicial?.telefone ?? ""}
                inputMode="tel"
                placeholder="(11) 99999-9999"
                className="campo"
              />
            </Campo>

            <Campo rotulo="CPF" dica="Aparece no termo de conclusão assinado.">
              <input
                name="documento"
                defaultValue={inicial?.documento ?? ""}
                placeholder="000.000.000-00"
                className="campo"
              />
            </Campo>

            <Campo
              rotulo="Comissão padrão (%)"
              dica="Sugerida ao criar uma OS para este montador."
            >
              <input
                name="comissaoPadrao"
                inputMode="decimal"
                defaultValue={String(inicial?.comissaoPadrao ?? 30)}
                className="campo"
              />
            </Campo>
          </div>

          <label className="flex items-center gap-2.5 rounded-xl border border-borda px-3 py-2.5">
            <input
              type="checkbox"
              name="ativo"
              defaultChecked={inicial?.ativo ?? true}
              className="h-4 w-4 accent-marca-500"
            />
            <span className="text-sm text-texto">
              Acesso ativo
              <span className="block text-[11px] text-suave">
                Desmarque para bloquear o login sem apagar o histórico.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {inicial ? (
              <FormConfirmar
                action={excluirUsuario}
                mensagem={`Excluir o acesso de ${inicial.nome}? As ordens de serviço serão mantidas sem montador vinculado.`}
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
                {inicial ? "Salvar alterações" : "Criar acesso"}
              </BotaoEnviar>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
