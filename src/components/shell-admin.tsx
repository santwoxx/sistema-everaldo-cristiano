"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  LayoutGrid,
  Link2,
  LogOut,
  Menu,
  Smartphone,
  Users,
  Wrench,
  X,
  FileText,
  Contact,
  User,
} from "lucide-react";
import { Marca } from "@/components/marca";
import { iniciais } from "@/lib/format";
import type { Sessao } from "@/lib/auth";
import { MeuPerfilModal } from "@/components/meu-perfil-modal";

type ItemMenu = {
  href: string;
  rotulo: string;
  icone: ReactNode;
  cabecalho: string;
  subtitulo: string;
  selo?: string;
  contagem?: number;
};

export function ShellAdmin({
  sessao,
  naoLidas,
  orcamentosNovos,
  children,
  acoesCabecalho,
  restaurarDemo,
}: {
  sessao: Sessao;
  naoLidas: number;
  orcamentosNovos: number;
  children: ReactNode;
  acoesCabecalho?: ReactNode;
  restaurarDemo?: ReactNode;
}) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const [contaAberta, setContaAberta] = useState(false);
  const [perfilAberto, setPerfilAberto] = useState(false);

  const itens: ItemMenu[] = [
    {
      href: "/painel",
      rotulo: "Painel Financeiro",
      icone: <LayoutGrid size={17} />,
      cabecalho: "Painel Financeiro",
      subtitulo: "Fluxo de caixa, receitas e lucratividade",
    },
    {
      href: "/ordens",
      rotulo: "Ordens de Serviço",
      icone: <Wrench size={17} />,
      cabecalho: "Ordens de Serviço",
      subtitulo: "Agenda, execução e assinaturas digitais",
    },
    {
      href: "/orcamentos",
      rotulo: "Orçamentos Recebidos",
      icone: <FileText size={17} />,
      cabecalho: "Orçamentos Recebidos",
      subtitulo: "Solicitações enviadas pelos clientes",
      contagem: orcamentosNovos,
    },
    {
      href: "/clientes",
      rotulo: "Clientes",
      icone: <Contact size={17} />,
      cabecalho: "Clientes",
      subtitulo: "Cadastro, histórico e contatos",
    },
    {
      href: "/equipe",
      rotulo: "Equipe & Logins",
      icone: <Users size={17} />,
      cabecalho: "Equipe & Logins",
      subtitulo: "Montadores, acessos e comissões",
    },
    {
      href: "/montador",
      rotulo: "Painel do Montador",
      icone: <Smartphone size={17} />,
      cabecalho: "Painel do Montador",
      subtitulo: "Versão de campo, otimizada para celular",
      selo: "App",
    },
  ];

  const atual =
    itens.find((i) => i.href !== "/painel" && pathname.startsWith(i.href)) ??
    itens.find((i) => pathname.startsWith("/painel")) ??
    itens[0];

  // Fecha a gaveta ao navegar no celular.
  useEffect(() => {
    setMenuAberto(false);
    setContaAberta(false);
  }, [pathname]);

  const navegacao = (
    <nav className="flex h-full flex-col gap-1 p-3">
      <p className="rotulo px-3 pb-1 pt-2">Menu principal</p>

      {itens.map((item) => {
        const ativo =
          item.href === "/painel"
            ? pathname.startsWith("/painel")
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              ativo
                ? "bg-marca-50 text-marca-700 ring-1 ring-marca-100"
                : "text-suave hover:bg-marca-50/60 hover:text-marca-700"
            }`}
          >
            <span className={ativo ? "text-marca-500" : "text-suave group-hover:text-marca-500"}>
              {item.icone}
            </span>
            <span className="flex-1 leading-tight">{item.rotulo}</span>
            {item.selo && (
              <span className="rounded-md bg-marca-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {item.selo}
              </span>
            )}
            {!!item.contagem && item.contagem > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {item.contagem > 99 ? "99+" : item.contagem}
              </span>
            )}
          </Link>
        );
      })}

      <Link
        href="/links"
        className={`mt-4 flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
          pathname.startsWith("/links")
            ? "bg-marca-600 text-white"
            : "bg-marca-500 text-white hover:bg-marca-600"
        }`}
      >
        <Link2 size={16} />
        Gerar Link p/ Cliente
      </Link>

      <div className="mt-auto space-y-2 pt-4">
        <form action="/api/sair" method="post">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-borda px-3 py-2.5 text-xs font-semibold text-suave transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={14} /> Sair da conta
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-dvh">
      <MeuPerfilModal
        sessao={sessao}
        aberto={perfilAberto}
        aoFechar={() => setPerfilAberto(false)}
      />

      {/* Sidebar fixa no desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-borda bg-white lg:flex">
        <div className="border-b border-borda px-4 py-4">
          <Link href="/painel" aria-label="Início">
            <Marca tamanho={38} />
          </Link>
        </div>
        <div className="rolagem-fina flex-1 overflow-y-auto">{navegacao}</div>
      </aside>

      {/* Gaveta no celular */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-marca-950/45 backdrop-blur-[2px]"
            onClick={() => setMenuAberto(false)}
            aria-hidden
          />
          <aside className="animar-entrada relative flex h-full w-[270px] max-w-[85vw] flex-col bg-white shadow-[var(--shadow-flutuante)]">
            <div className="flex items-center justify-between border-b border-borda px-4 py-4">
              <Marca tamanho={38} />
              <button
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
                className="btn btn-fantasma !p-1.5"
              >
                <X size={18} />
              </button>
            </div>
            <div className="rolagem-fina flex-1 overflow-y-auto">{navegacao}</div>
          </aside>
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[232px]">
        <header className="sticky top-0 z-20 border-b border-borda bg-white/85 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              className="btn btn-fantasma !p-2 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold tracking-tight text-texto sm:text-xl">
                {atual.cabecalho}
              </h1>
              <p className="hidden truncate text-xs text-suave sm:block">
                {atual.subtitulo}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {acoesCabecalho}

              <Link
                href="/links"
                className="btn btn-claro hidden !px-3 sm:inline-flex"
                title="Gerar link de orçamento para o cliente"
              >
                <Link2 size={15} /> Link p/ Cliente
              </Link>

              <Link
                href="/painel#notificacoes"
                className="relative btn btn-fantasma !p-2"
                aria-label={`Notificações (${naoLidas} não lidas)`}
              >
                <Bell size={18} />
                {naoLidas > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold text-white">
                    {naoLidas > 9 ? "9+" : naoLidas}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  onClick={() => setContaAberta((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-borda bg-white py-1 pl-1 pr-2 transition-colors hover:bg-marca-50"
                  aria-expanded={contaAberta}
                  aria-haspopup="menu"
                >
                  {sessao.foto ? (
                    <img
                      src={sessao.foto}
                      alt={sessao.nome}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-marca-500/20"
                    />
                  ) : (
                    <span
                      className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white"
                      style={{ background: sessao.corAvatar }}
                    >
                      {iniciais(sessao.nome)}
                    </span>
                  )}
                  <span className="hidden text-left leading-tight sm:block">
                    <span className="block text-xs font-semibold text-texto">
                      {sessao.nome.split(" ")[0]}
                    </span>
                    <span className="block text-[10px] font-medium uppercase tracking-wide text-suave">
                      {sessao.papel === "ADMIN" ? "Administrador" : "Montador"}
                    </span>
                  </span>
                  <ChevronDown size={15} className="text-suave" />
                </button>

                {contaAberta && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setContaAberta(false)}
                      aria-hidden
                    />
                    <div
                      role="menu"
                      className="animar-entrada absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-borda bg-white shadow-[var(--shadow-flutuante)]"
                    >
                      <div className="border-b border-borda px-4 py-3 flex items-center gap-3">
                        {sessao.foto ? (
                          <img
                            src={sessao.foto}
                            alt={sessao.nome}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white shrink-0"
                            style={{ background: sessao.corAvatar }}
                          >
                            {iniciais(sessao.nome)}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-texto">{sessao.nome}</p>
                          <p className="truncate text-xs text-suave">{sessao.email}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setContaAberta(false);
                          setPerfilAberto(true);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-suave hover:bg-marca-50 hover:text-marca-700 text-left transition-colors"
                      >
                        <User size={15} /> Meu Perfil
                      </button>

                      <Link
                        href="/equipe"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-suave hover:bg-marca-50 hover:text-marca-700"
                      >
                        <Users size={15} /> Equipe & Logins
                      </Link>
                      <Link
                        href="/montador"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-suave hover:bg-marca-50 hover:text-marca-700"
                      >
                        <Smartphone size={15} /> Abrir app do montador
                      </Link>
                      <form action="/api/sair" method="post" className="border-t border-borda">
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut size={15} /> Sair da conta
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1180px] flex-1 space-y-5 p-4 sm:p-6">
          {children}
        </main>

        <footer className="px-6 py-5 text-center text-[11px] text-suave">
          EC Montagens de Móveis · Qualidade • Detalhes • Confiança
        </footer>
      </div>
    </div>
  );
}
