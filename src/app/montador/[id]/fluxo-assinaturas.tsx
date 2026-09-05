"use client";

/* eslint-disable @next/next/no-img-element */
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  HandHeart,
  PenLine,
  ShieldCheck,
  Smartphone,
  Star,
  UserCheck,
} from "lucide-react";
import { assinar, type EstadoAssinatura } from "@/app/actions/assinaturas";
import { AssinaturaPad } from "@/components/assinatura-pad";
import { Aviso, BotaoEnviar, Campo } from "@/components/form";
import { dataHora } from "@/lib/format";

type Assinatura = {
  id: string;
  tipo: string;
  nome: string;
  imagem: string;
  assinadoEm: string;
};

export function FluxoAssinaturas({
  ordemId,
  assinaturas,
  tudoFeito,
  totalEtapas,
  etapasFeitas,
  nomeMontador,
  documentoMontador,
  nomeCliente,
  documentoCliente,
  cancelada,
}: {
  ordemId: string;
  assinaturas: Assinatura[];
  tudoFeito: boolean;
  totalEtapas: number;
  etapasFeitas: number;
  nomeMontador: string;
  documentoMontador: string | null;
  nomeCliente: string;
  documentoCliente: string | null;
  cancelada: boolean;
}) {
  const montador = assinaturas.find((a) => a.tipo === "MONTADOR");
  const cliente = assinaturas.find((a) => a.tipo === "CLIENTE");
  const completo = !!montador && !!cliente;

  const [entregando, setEntregando] = useState(false);

  if (cancelada) {
    return (
      <section className="cartao p-5 text-center">
        <p className="text-sm font-semibold text-texto">
          Esta ordem de serviço foi cancelada.
        </p>
      </section>
    );
  }

  /* ------------------------------------------------------ Tudo assinado */
  if (completo) {
    return (
      <section className="cartao overflow-hidden">
        <div className="bg-marca-50 px-5 py-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-marca-500 text-white">
            <CheckCircle2 size={28} />
          </span>
          <h2 className="mt-3 text-base font-bold text-marca-800">
            Serviço concluído e assinado!
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-marca-700">
            O termo foi enviado ao painel administrativo e a comissão já entrou no
            seu fechamento.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4">
          {[montador, cliente].map((a) => (
            <div key={a!.id} className="rounded-xl border border-borda p-2.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-suave">
                {a!.tipo === "MONTADOR" ? "Montador" : "Cliente"}
              </p>
              <div className="my-1.5 grid h-12 place-items-center">
                <img
                  src={a!.imagem}
                  alt={`Assinatura de ${a!.nome}`}
                  className="max-h-12 w-auto max-w-full object-contain"
                />
              </div>
              <p className="truncate text-[11px] font-semibold text-texto">{a!.nome}</p>
              <p className="text-[9px] text-suave">{dataHora(a!.assinadoEm)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-borda p-4">
          <Link
            href={`/comprovante/${ordemId}`}
            target="_blank"
            className="btn btn-claro w-full"
          >
            <FileText size={16} /> Ver comprovante assinado
          </Link>
        </div>
      </section>
    );
  }

  /* ------------------------------------------- Etapa 1: assinar montador */
  if (!montador) {
    return (
      <section className="cartao p-4">
        <Cabecalho
          passo={1}
          titulo="Assinatura do montador"
          descricao="Confirme que o serviço foi executado conforme o combinado."
          icone={<UserCheck size={16} />}
        />

        {!tudoFeito && totalEtapas > 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] font-medium leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-200">
            Faltam {totalEtapas - etapasFeitas} etapa(s) do checklist. Você pode
            assinar mesmo assim, mas confira antes se está tudo pronto.
          </p>
        )}

        <FormAssinatura
          ordemId={ordemId}
          tipo="MONTADOR"
          nomeSugerido={nomeMontador}
          documentoSugerido={documentoMontador}
          textoBotao="Assinar como montador"
          declaracao="Declaro que executei o serviço descrito nesta ordem, entreguei o local limpo e orientei o cliente sobre o uso e a conservação dos móveis."
        />
      </section>
    );
  }

  /* ------------------------------------------- Etapa 2: assinar cliente */
  return (
    <section className="cartao p-4">
      <Cabecalho
        passo={2}
        titulo="Assinatura do cliente"
        descricao={`Entregue o aparelho para ${nomeCliente.split(" ")[0]} confirmar o recebimento.`}
        icone={<PenLine size={16} />}
      />

      <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-marca-50 px-3 py-2.5">
        <CheckCircle2 size={16} className="shrink-0 text-marca-500" />
        <p className="text-[11px] font-medium leading-snug text-marca-800">
          Montador <strong>{montador.nome}</strong> assinou em{" "}
          {dataHora(montador.assinadoEm)}.
        </p>
      </div>

      {!entregando ? (
        <div className="mt-4 rounded-xl border-2 border-dashed border-marca-200 bg-[#fbfdfc] p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-marca-500 text-white">
            <HandHeart size={22} />
          </span>
          <p className="mt-3 text-sm font-bold text-texto">
            Passe o celular para o cliente
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-suave">
            {nomeCliente} deve conferir o serviço e assinar na tela para concluir a
            ordem de serviço.
          </p>
          <button
            type="button"
            onClick={() => setEntregando(true)}
            className="btn btn-principal mt-4 w-full !py-3"
          >
            <Smartphone size={17} /> Entregar para o cliente assinar
          </button>
        </div>
      ) : (
        <FormAssinatura
          ordemId={ordemId}
          tipo="CLIENTE"
          nomeSugerido={nomeCliente}
          documentoSugerido={documentoCliente}
          textoBotao="Confirmar e assinar"
          declaracao="Declaro que o serviço foi executado e entregue integralmente, que o local foi limpo e que recebi as orientações de uso e conservação dos móveis."
          comAvaliacao
          aoCancelar={() => setEntregando(false)}
        />
      )}
    </section>
  );
}

function Cabecalho({
  passo,
  titulo,
  descricao,
  icone,
}: {
  passo: number;
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-marca-500 text-white">
        {icone}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-marca-500">
          Passo {passo} de 2
        </p>
        <h2 className="text-sm font-bold text-texto">{titulo}</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-suave">{descricao}</p>
      </div>
    </div>
  );
}

function FormAssinatura({
  ordemId,
  tipo,
  nomeSugerido,
  documentoSugerido,
  textoBotao,
  declaracao,
  comAvaliacao,
  aoCancelar,
}: {
  ordemId: string;
  tipo: "MONTADOR" | "CLIENTE";
  nomeSugerido: string;
  documentoSugerido: string | null;
  textoBotao: string;
  declaracao: string;
  comAvaliacao?: boolean;
  aoCancelar?: () => void;
}) {
  const router = useRouter();
  const [estado, acao] = useActionState<EstadoAssinatura, FormData>(assinar, {});
  const [traco, setTraco] = useState<string | null>(null);
  const [nota, setNota] = useState(0);

  useEffect(() => {
    if (estado.sucesso) router.refresh();
  }, [estado.sucesso, router]);

  return (
    <form action={acao} className="mt-4 space-y-4">
      <input type="hidden" name="ordemId" value={ordemId} />
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="imagem" value={traco ?? ""} />
      <input type="hidden" name="nota" value={nota} />

      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}

      <p className="rounded-lg bg-[#f7f9f8] p-3 text-[11px] leading-relaxed text-texto">
        {declaracao}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Nome completo" obrigatorio>
          <input
            name="nome"
            required
            defaultValue={nomeSugerido}
            autoComplete="name"
            className="campo"
          />
        </Campo>
        <Campo rotulo="CPF / CNPJ">
          <input
            name="documento"
            defaultValue={documentoSugerido ?? ""}
            inputMode="numeric"
            placeholder="Opcional"
            className="campo"
          />
        </Campo>
      </div>

      <AssinaturaPad aoMudar={setTraco} altura={190} />

      {comAvaliacao && (
        <div>
          <p className="etiqueta">Como foi o atendimento? (opcional)</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNota(n === nota ? 0 : n)}
                aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                className="rounded-md p-1 transition-transform active:scale-90"
              >
                <Star
                  size={26}
                  className={n <= nota ? "fill-ouro-400 text-ouro-400" : "text-borda"}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {aoCancelar && (
          <button type="button" onClick={aoCancelar} className="btn btn-fantasma">
            Voltar
          </button>
        )}
        <BotaoEnviar
          className="btn btn-principal flex-1 !py-3 !text-base"
          icone={<PenLine size={17} />}
          disabled={!traco}
        >
          {traco ? textoBotao : "Assine no quadro acima"}
        </BotaoEnviar>
      </div>

      <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-suave">
        <ShieldCheck size={12} className="mt-0.5 shrink-0 text-marca-500" />
        Registramos data, hora, endereço de rede e código de integridade SHA-256
        junto da assinatura.
      </p>
    </form>
  );
}
