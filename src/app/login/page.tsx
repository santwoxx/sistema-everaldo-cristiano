import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sessaoAtual } from "@/lib/auth";
import { FormularioLogin } from "./formulario";
import { Marca } from "@/components/marca";
import { CheckCircle2, PenLine, TrendingUp, Wrench } from "lucide-react";

export const metadata: Metadata = { title: "Entrar" };

const destaques = [
  {
    icone: <TrendingUp size={16} />,
    titulo: "Fluxo de caixa em tempo real",
    texto: "Receitas, despesas, comissões e lucro líquido consolidados.",
  },
  {
    icone: <Wrench size={16} />,
    titulo: "Ordens de serviço na palma da mão",
    texto: "O montador acompanha a agenda e executa o checklist pelo celular.",
  },
  {
    icone: <PenLine size={16} />,
    titulo: "Assinatura digital na entrega",
    texto: "Montador e cliente assinam na tela e o comprovante chega no painel.",
  },
];

export default async function PaginaLogin() {
  const sessao = await sessaoAtual();
  if (sessao) redirect(sessao.papel === "ADMIN" ? "/painel" : "/montador");

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Vitrine da marca */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-marca-950 via-marca-800 to-marca-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-ouro-400/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-marca-400/20 blur-3xl"
        />

        <div className="relative">
          <Marca tamanho={54} claro />
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
            Gestão Financeira & Operacional
          </span>
          <h2 className="mt-5 text-[34px] font-bold leading-[1.15] tracking-tight">
            Todo o seu negócio de montagem em um só lugar.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-marca-50/80">
            Do orçamento enviado pelo cliente até a assinatura digital na entrega —
            com o financeiro fechando sozinho a cada serviço concluído.
          </p>

          <ul className="mt-8 space-y-4">
            {destaques.map((d) => (
              <li key={d.titulo} className="flex gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15 backdrop-blur-sm">
                  {d.icone}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{d.titulo}</span>
                  <span className="block text-xs text-marca-50/75">{d.texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] font-medium uppercase tracking-[0.22em] text-marca-100/60">
          Qualidade • Detalhes • Confiança
        </p>
      </aside>

      {/* Formulário */}
      <main className="flex items-center justify-center bg-tela px-5 py-10 sm:px-8">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <Marca tamanho={52} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-texto">
            Acesse o sistema
          </h1>
          <p className="mt-1 text-sm text-suave">
            Entre com as credenciais cadastradas para a sua equipe.
          </p>

          <div className="mt-7">
            <FormularioLogin />
          </div>

          <div className="mt-7 rounded-xl border border-borda bg-white p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-marca-700">
              <CheckCircle2 size={14} /> Acesso de demonstração
            </p>
            <dl className="mt-2 space-y-1 text-xs text-suave">
              <div className="flex justify-between gap-3">
                <dt>Administrador</dt>
                <dd className="font-mono text-texto">admin@ecmontagens.com.br</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Montador</dt>
                <dd className="font-mono text-texto">montador@ecmontagens.com.br</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-borda pt-1">
                <dt>Senha</dt>
                <dd className="font-mono text-texto">ecmontagens2024</dd>
              </div>
            </dl>
          </div>

          <p className="mt-6 text-center text-[11px] text-suave">
            © {new Date().getFullYear()} EC Montagens de Móveis
          </p>
        </div>
      </main>
    </div>
  );
}
