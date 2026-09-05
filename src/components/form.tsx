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
  children,
  largura = "max-w-2xl",
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao?: string;
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-marca-950/45 backdrop-blur-[2px]"
        onClick={aoFechar}
        aria-hidden
      />
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={`animar-entrada relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-[var(--shadow-flutuante)] outline-none sm:rounded-2xl ${largura}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-borda px-5 py-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-texto">{titulo}</h2>
            {descricao && <p className="mt-0.5 text-xs text-suave">{descricao}</p>}
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="btn btn-fantasma !p-1.5"
          >
            <X size={17} />
          </button>
        </header>
        <div className="rolagem-fina overflow-y-auto px-5 py-5">{children}</div>
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
