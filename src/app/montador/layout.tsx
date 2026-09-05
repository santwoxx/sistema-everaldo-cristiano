import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { exigirSessao } from "@/lib/auth";
import { Marca } from "@/components/marca";
import { iniciais } from "@/lib/format";

export default async function LayoutMontador({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await exigirSessao();
  const ehAdmin = sessao.papel === "ADMIN";

  return (
    <div className="min-h-dvh bg-tela">
      <header className="sticky top-0 z-20 bg-gradient-to-br from-marca-900 via-marca-800 to-marca-600 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3.5">
          <Link href="/montador" aria-label="Início do app">
            <Marca tamanho={38} claro compacto />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight">Painel do Montador</p>
            <p className="truncate text-[11px] text-marca-100/75">
              {sessao.nome}
              {ehAdmin && " · visualizando como administrador"}
            </p>
          </div>

          {ehAdmin && (
            <Link
              href="/painel"
              className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <ArrowLeft size={13} /> Admin
            </Link>
          )}

          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ring-2 ring-white/30"
            style={{ background: sessao.corAvatar }}
          >
            {iniciais(sessao.nome)}
          </span>

          <form action="/api/sair" method="post">
            <button
              type="submit"
              aria-label="Sair"
              className="rounded-lg p-2 transition-colors hover:bg-white/15"
            >
              <LogOut size={17} />
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-5">{children}</main>

      <footer className="px-4 pb-8 pt-2 text-center text-[11px] text-suave">
        EC Montagens de Móveis · Qualidade • Detalhes • Confiança
      </footer>
    </div>
  );
}
