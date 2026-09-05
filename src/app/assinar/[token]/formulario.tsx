"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Star } from "lucide-react";
import { assinar, type EstadoAssinatura } from "@/app/actions/assinaturas";
import { AssinaturaPad } from "@/components/assinatura-pad";
import { Aviso, BotaoEnviar, Campo } from "@/components/form";

export function FormularioAssinaturaCliente({
  ordemId,
  nomeSugerido,
  documentoSugerido,
}: {
  ordemId: string;
  nomeSugerido: string;
  documentoSugerido: string | null;
}) {
  const router = useRouter();
  const [estado, acao] = useActionState<EstadoAssinatura, FormData>(assinar, {});
  const [traco, setTraco] = useState<string | null>(null);
  const [nota, setNota] = useState(0);

  useEffect(() => {
    if (estado.sucesso) router.refresh();
  }, [estado.sucesso, router]);

  return (
    <div className="space-y-5">
      <form action={acao} className="space-y-4">
        <input type="hidden" name="ordemId" value={ordemId} />
        <input type="hidden" name="tipo" value="CLIENTE" />
        <input type="hidden" name="imagem" value={traco ?? ""} />

        {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome de quem assina" obrigatorio>
            <input
              name="nome"
              required
              defaultValue={nomeSugerido}
              autoComplete="name"
              className="campo"
            />
          </Campo>
          <Campo rotulo="CPF / CNPJ" dica="Opcional, reforça a validade do termo.">
            <input
              name="documento"
              defaultValue={documentoSugerido ?? ""}
              inputMode="numeric"
              placeholder="000.000.000-00"
              className="campo"
            />
          </Campo>
        </div>

        <AssinaturaPad aoMudar={setTraco} rotulo="Assine no quadro abaixo" altura={200} />

        {/* Avaliação opcional, gravada junto com o aceite */}
        <div>
          <p className="etiqueta">Como foi o atendimento? (opcional)</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNota(n === nota ? 0 : n)}
                aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                className="rounded-md p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={26}
                  className={n <= nota ? "fill-ouro-400 text-ouro-400" : "text-borda"}
                />
              </button>
            ))}
          </div>
          <input type="hidden" name="nota" value={nota} />
        </div>

        <BotaoEnviar
          className="btn btn-principal w-full !py-3 !text-base"
          icone={<PenLine size={17} />}
          disabled={!traco}
        >
          {traco ? "Confirmar e assinar" : "Assine no quadro para continuar"}
        </BotaoEnviar>
      </form>
    </div>
  );
}
