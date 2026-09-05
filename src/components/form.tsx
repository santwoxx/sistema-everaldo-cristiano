"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, Loader2, X } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Botao de envio com estado de carregamento                                  */
/* -------------------------------------------------------------------------- */

export function BotaoEnviar({
  children,
  className = "btn btn-principal",
  icone,
  carregando: forcado,
  ...props
}: {
  children: ReactNode;
  className?: string;
  icone?: ReactNode;
  carregando?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  const carregando = forcado ?? pending;

  return (
    <button type="submit" disabled={carregando} className={className} {...props}>
      {carregando ? <Loader2 size={15} className="animate-spin" /> : icone}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Mensagem de erro/sucesso de formulario                                     */
/* -------------------------------------------------------------------------- */

export function Aviso({
  tipo = "erro",
  children,
}: {
  tipo?: "erro" | "sucesso" | "info";
  children: ReactNode;
}) {
  if (!children) return null;
  const estilos = {
    erro: "bg-rose-50 text-rose-700 ring-rose-200",
    sucesso: "bg-marca-50 text-marca-700 ring-marca-200",
    info: "bg-sky-50 text-sky-700 ring-sky-200",
  } as const;
  return (
    <p
      role={tipo === "erro" ? "alert" : "status"}
      className={`rounded-lg px-3 py-2 text-xs font-medium ring-1 ring-inset ${estilos[tipo]}`}
    >
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Campo rotulado                                                             */
/* -------------------------------------------------------------------------- */

export function Campo({
  rotulo,
  obrigatorio,
  dica,
  children,
  className = "",
}: {
  rotulo: string;
  obrigatorio?: boolean;
  dica?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="etiqueta">
        {rotulo}
        {obrigatorio && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {dica && <p className="mt-1 text-[11px] text-suave">{dica}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal acessivel                                                            */
/* -------------------------------------------------------------------------- */

export function Modal({
  aberto,
  aoFechar,
  titulo,
  descricao,
  icone,
  children,
  largura = "max-w-2xl",
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao?: string;
  icone?: ReactNode;
  children: ReactNode;
  largura?: string;
}) {
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    document.addEventListener("keydown", onKey);
    painelRef.current?.focus();
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", onKey);
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={aoFechar}
        aria-hidden
      />
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={`animar-entrada relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_25px_70px_rgba(0,0,0,0.6)] border-2 border-black sm:border-[2.5px] sm:border-black sm:rounded-2xl outline-none ring-1 ring-black/30 ${largura}`}
      >
        <header className="flex items-center justify-between gap-4 border-b-2 border-black bg-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            {icone && (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-900 border-2 border-black shadow-xs">
                {icone}
              </span>
            )}
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-950 sm:text-lg">
                {titulo}
              </h2>
              {descricao && (
                <p className="mt-0.5 text-xs font-medium text-slate-600 line-clamp-2">{descricao}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-400 bg-white text-slate-700 shadow-xs transition-colors hover:bg-black hover:text-white hover:border-black"
          >
            <X size={18} />
          </button>
        </header>
        <div className="rolagem-fina overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Copiar para a area de transferencia                                        */
/* -------------------------------------------------------------------------- */

export function BotaoCopiar({
  texto,
  rotulo = "Copiar",
  className = "btn btn-claro",
}: {
  texto: string;
  rotulo?: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Fallback para navegadores sem permissao de clipboard.
      const alvo = document.createElement("textarea");
      alvo.value = texto;
      alvo.style.position = "fixed";
      alvo.style.opacity = "0";
      document.body.appendChild(alvo);
      alvo.select();
      document.execCommand("copy");
      alvo.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button type="button" onClick={copiar} className={className}>
      {copiado ? <Check size={15} /> : <Copy size={15} />}
      {copiado ? "Copiado!" : rotulo}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Confirmacao antes de acoes destrutivas                                     */
/* -------------------------------------------------------------------------- */

export function FormConfirmar({
  action,
  mensagem,
  children,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  mensagem: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!window.confirm(mensagem)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
