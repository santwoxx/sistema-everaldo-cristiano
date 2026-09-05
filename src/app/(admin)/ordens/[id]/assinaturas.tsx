/* eslint-disable @next/next/no-img-element */
import {
  Fingerprint,
  Globe,
  PenLine,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCheck,
} from "lucide-react";
import { dataHora } from "@/lib/format";
import { Painel } from "@/components/ui";
import { FormConfirmar } from "@/components/form";
import { anularAssinatura } from "@/app/actions/assinaturas";

type Assinatura = {
  id: string;
  tipo: string;
  nome: string;
  documento: string | null;
  imagem: string;
  hash: string;
  ip: string | null;
  userAgent: string | null;
  assinadoEm: string;
};

export function BlocoAssinaturas({
  ordemId,
  assinaturas,
  linkAssinatura,
  clienteNome,
  telefoneCliente,
  osNum,
}: {
  ordemId: string;
  assinaturas: Assinatura[];
  linkAssinatura: string;
  clienteNome: string;
  telefoneCliente: string | null;
  osNum: string;
}) {
  const montador = assinaturas.find((a) => a.tipo === "MONTADOR");
  const cliente = assinaturas.find((a) => a.tipo === "CLIENTE");
  const completo = !!montador && !!cliente;

  return (
    <Painel
      titulo="Assinaturas digitais"
      descricao="Termo de conclusão assinado pelas duas partes"
      acoes={
        completo ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-marca-50 px-2.5 py-1 text-[11px] font-bold text-marca-700 ring-1 ring-inset ring-marca-200">
            <ShieldCheck size={13} /> Documento completo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
            Aguardando {!montador ? "montador" : "cliente"}
          </span>
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Quadro
          titulo="Montador responsável"
          icone={<UserCheck size={15} />}
          assinatura={montador}
          vazio="O montador assina pelo app ao finalizar o serviço."
        />
        <Quadro
          titulo="Cliente"
          icone={<PenLine size={15} />}
          assinatura={cliente}
          vazio={`${clienteNome} assina no aparelho do montador ou pelo link enviado.`}
        />
      </div>

      {!completo && (
        <p className="mt-4 rounded-lg bg-[#f7f9f8] px-3 py-2.5 text-[11px] leading-relaxed text-suave">
          Enquanto faltar uma assinatura a OS não é concluída e a receita não entra
          no caixa. Use o link de assinatura na lateral para enviar ao cliente
          {telefoneCliente ? " pelo WhatsApp" : ""}.
        </p>
      )}
    </Painel>
  );
}

function Quadro({
  titulo,
  icone,
  assinatura,
  vazio,
}: {
  titulo: string;
  icone: React.ReactNode;
  assinatura?: Assinatura;
  vazio: string;
}) {
  if (!assinatura) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-borda bg-[#fbfcfc] p-6 text-center">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-suave ring-1 ring-borda">
          {icone}
        </span>
        <p className="text-xs font-semibold text-texto">{titulo}</p>
        <p className="max-w-[220px] text-[11px] leading-relaxed text-suave">{vazio}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-borda">
      <div className="flex items-center justify-between gap-2 border-b border-borda bg-[#fbfcfc] px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-texto">
          <span className="text-marca-500">{icone}</span>
          {titulo}
        </span>
        <FormConfirmar
          action={anularAssinatura}
          mensagem={`Anular a assinatura de ${assinatura.nome}? A OS voltará para "aguardando assinatura".`}
        >
          <input type="hidden" name="id" value={assinatura.id} />
          <button
            type="submit"
            title="Anular assinatura"
            className="btn btn-fantasma !p-1 hover:!text-rose-600"
          >
            <Trash2 size={13} />
          </button>
        </FormConfirmar>
      </div>

      <div className="grid min-h-[92px] place-items-center bg-white px-3 py-2">
        <img
          src={assinatura.imagem}
          alt={`Assinatura de ${assinatura.nome}`}
          className="max-h-20 w-auto max-w-full object-contain"
        />
      </div>

      <div className="border-t border-dashed border-borda px-3 py-2.5">
        <p className="text-sm font-semibold text-texto">{assinatura.nome}</p>
        {assinatura.documento && (
          <p className="text-[11px] text-suave">Doc.: {assinatura.documento}</p>
        )}

        <dl className="mt-2 space-y-1 text-[10px] text-suave">
          <div className="flex items-center gap-1.5">
            <PenLine size={10} className="shrink-0" />
            <span>{dataHora(assinatura.assinadoEm)}</span>
          </div>
          {assinatura.ip && (
            <div className="flex items-center gap-1.5">
              <Globe size={10} className="shrink-0" />
              <span>IP {assinatura.ip}</span>
            </div>
          )}
          {assinatura.userAgent && (
            <div className="flex items-start gap-1.5">
              <Smartphone size={10} className="mt-0.5 shrink-0" />
              <span className="line-clamp-1">{assinatura.userAgent}</span>
            </div>
          )}
          <div className="flex items-start gap-1.5">
            <Fingerprint size={10} className="mt-0.5 shrink-0" />
            <span className="break-all font-mono">{assinatura.hash.slice(0, 32)}…</span>
          </div>
        </dl>
      </div>
    </div>
  );
}
