"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react";
import { entrar, type EstadoLogin } from "@/app/actions/auth";
import { Aviso, BotaoEnviar, Campo } from "@/components/form";

export function FormularioLogin() {
  const [estado, acao] = useActionState<EstadoLogin, FormData>(entrar, {});
  const [visivel, setVisivel] = useState(false);

  return (
    <form action={acao} className="space-y-4">
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}

      <Campo rotulo="E-mail" obrigatorio>
        <div className="relative">
          <Mail
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-suave"
          />
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            autoFocus
            placeholder="voce@ecmontagens.com.br"
            className="campo pl-9"
          />
        </div>
      </Campo>

      <Campo rotulo="Senha" obrigatorio>
        <div className="relative">
          <input
            name="senha"
            type={visivel ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="campo pr-10"
          />
          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-suave transition-colors hover:bg-marca-50 hover:text-marca-600"
          >
            {visivel ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Campo>

      <BotaoEnviar className="btn btn-principal w-full !py-2.5" icone={<LogIn size={16} />}>
        Entrar no sistema
      </BotaoEnviar>
    </form>
  );
}
