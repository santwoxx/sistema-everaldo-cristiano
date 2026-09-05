import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock, MessageCircle, ShieldCheck, Star, Wrench } from "lucide-react";
import { dbLinks } from "@/lib/firestore";
import { Marca } from "@/components/marca";
import { FormularioOrcamentoPublico } from "./formulario";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Solicite seu orçamento · EC Montagens de Móveis",
  description:
    "Montagem, desmontagem e reparo de móveis com qualidade, detalhes e confiança.",
};

const diferenciais = [
  {
    icone: <Wrench size={15} />,
    titulo: "Equipe especializada",
    texto: "Montadores próprios, com ferramenta profissional e experiência em planejados.",
  },
  {
    icone: <CalendarClock size={15} />,
    titulo: "Resposta rápida",
    texto: "Retornamos com o orçamento em até 24 horas úteis.",
  },
  {
    icone: <ShieldCheck size={15} />,
    titulo: "Serviço documentado",
    texto: "Ordem de serviço, checklist de qualidade e termo assinado na entrega.",
  },
];

export default async function PaginaOrcamentoPublico({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const link = await dbLinks.buscarPorToken(token);
  if (!link) notFound();

  const expirado = !!link.expiraEm && new Date(link.expiraEm).getTime() < Date.now();
  const indisponivel = !link.ativo || expirado;

  // Contador de acessos — informação útil no painel de links.
  if (!indisponivel) {
    await dbLinks.incrementarAcessos(link.id);
  }

  return (
    <div className="min-h-dvh bg-tela">
      {/* Capa */}
      <header className="relative overflow-hidden bg-gradient-to-br from-marca-950 via-marca-800 to-marca-600 px-5 pb-10 pt-7 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-ouro-400/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-marca-400/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-2xl">
          <Marca tamanho={52} claro />

          <span className="mt-6 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
            Orçamento sem compromisso
          </span>

          <h1 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-tight sm:text-[34px]">
            Seu móvel montado com
            <br />
            qualidade, detalhes e confiança.
          </h1>

          <p className="mt-3 max-w-lg text-sm leading-relaxed text-marca-50/85">
            {link.mensagem ??
              "Preencha os dados do seu móvel e retornamos com o orçamento rapidinho."}
          </p>

          <div className="mt-5 flex items-center gap-1.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} size={15} className="fill-ouro-400 text-ouro-400" />
            ))}
            <span className="ml-1 text-xs font-medium text-marca-50/80">
              Convencional · Modulados · Planejados · Reparos
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-5 max-w-2xl px-4 pb-10 sm:px-5">
        {indisponivel ? (
          <section className="cartao p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-600">
              <CalendarClock size={22} />
            </span>
            <h2 className="mt-3 text-base font-bold text-texto">
              Este link não está mais disponível
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-suave">
              {expirado
                ? "O prazo deste formulário expirou."
                : "Este formulário foi desativado."}{" "}
              Entre em contato com a EC Montagens de Móveis para receber um novo link
              e solicitar seu orçamento.
            </p>
          </section>
        ) : (
          <>
            <section className="cartao p-5 sm:p-6">
              <h2 className="text-base font-bold tracking-tight text-texto">
                Conte pra gente o que você precisa
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-suave">
                Leva menos de 2 minutos. Os campos marcados com{" "}
                <span className="text-rose-500">*</span> são obrigatórios.
              </p>

              <div className="mt-5">
                <FormularioOrcamentoPublico token={token} />
              </div>
            </section>

            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {diferenciais.map((d) => (
                <li key={d.titulo} className="cartao p-4">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-marca-50 text-marca-600">
                    {d.icone}
                  </span>
                  <p className="mt-2.5 text-sm font-bold text-texto">{d.titulo}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-suave">
                    {d.texto}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-5 flex items-start gap-2 px-1 text-[11px] leading-relaxed text-suave">
              <MessageCircle size={14} className="mt-0.5 shrink-0 text-marca-500" />
              Usamos seus dados apenas para elaborar e enviar este orçamento. Não
              compartilhamos suas informações com terceiros.
            </p>
          </>
        )}
      </main>

      <footer className="border-t border-borda bg-white px-5 py-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-marca-600">
          EC Montagens de Móveis
        </p>
        <p className="mt-1 text-[11px] text-suave">
          Qualidade • Detalhes • Confiança
        </p>
      </footer>
    </div>
  );
}
