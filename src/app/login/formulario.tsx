"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, Mail, ShieldCheck, Users } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { entrar, entrarComGoogle, type EstadoLogin } from "@/app/actions/auth";
import { Aviso, BotaoEnviar, Campo } from "@/components/form";

function IconeGoogle() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.43 7.37 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.57H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.43l4.03-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.28 2.57 1.25 6.57l4.03 3.11c.95-2.83 3.6-4.93 6.72-4.93z"
      />
    </svg>
  );
}

export function FormularioLogin() {
  const [estado, acao] = useActionState<EstadoLogin, FormData>(entrar, {});
  const [visivel, setVisivel] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);
  const [erroGoogle, setErroGoogle] = useState<string | null>(null);

  async function handleLoginGoogle() {
    setErroGoogle(null);
    setCarregandoGoogle(true);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const email = cred.user.email;

      if (!email) {
        throw new Error("Não foi possível identificar o e-mail da conta Google.");
      }

      const idToken = await cred.user.getIdToken();
      const res = await entrarComGoogle({
        email,
        nome: cred.user.displayName,
        foto: cred.user.photoURL,
        idToken,
      });

      if (res.erro) {
        setErroGoogle(res.erro);
        setCarregandoGoogle(false);
        return;
      }

      // Login bem-sucedido: redireciona diretamente ao painel
      window.location.href = "/painel";
    } catch (err: any) {
      setCarregandoGoogle(false);
      if (err?.code === "auth/popup-closed-by-user") {
        return; // Usuário apenas fechou a janela do Google
      }
      if (err?.code === "auth/unauthorized-domain") {
        setErroGoogle(
          "Domínio não autorizado no Firebase. Adicione este domínio na aba Authentication > Settings > Authorized domains do Firebase Console."
        );
        return;
      }
      setErroGoogle(err.message || "Falha ao entrar com Google.");
    }
  }

  return (
    <div className="space-y-5">
      {/* Bloco 1: Administrador via Google */}
      <div className="overflow-hidden rounded-2xl border-2 border-black bg-slate-900 p-4 text-white shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
            <ShieldCheck size={13} /> Administrador
          </span>
          <span className="font-mono text-[10px] text-slate-400">Google Exclusivo</span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          Acesso restrito ao administrador via Google (<strong className="text-white">valdocem@gmail.com</strong>).
        </p>

        {erroGoogle && (
          <div className="mt-3">
            <Aviso tipo="erro">{erroGoogle}</Aviso>
          </div>
        )}

        <button
          type="button"
          onClick={handleLoginGoogle}
          disabled={carregandoGoogle}
          className="mt-3.5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60"
        >
          {carregandoGoogle ? (
            <Loader2 size={16} className="animate-spin text-slate-700" />
          ) : (
            <IconeGoogle />
          )}
          <span>{carregandoGoogle ? "Autenticando..." : "Entrar como Administrador com Google"}</span>
        </button>
      </div>

      {/* Divisor */}
      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-tela px-3 text-[11px] font-extrabold tracking-wider text-slate-500">
            Colaboradores & Montadores
          </span>
        </div>
      </div>

      {/* Bloco 2: Colaboradores e Funcionários via Email e Senha */}
      <div className="rounded-2xl border-2 border-black bg-white p-4 shadow-sm">
        <div className="mb-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Users size={14} className="text-marca-600" /> Acesso da Equipe
          </span>
          <p className="text-[11px] text-slate-600">
            Entre com o login e a senha criados pelo administrador.
          </p>
        </div>

        <form action={acao} className="space-y-3.5">
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
                placeholder="colaborador@ecmontagens.com.br"
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
            Entrar como Colaborador
          </BotaoEnviar>
        </form>
      </div>
    </div>
  );
}

