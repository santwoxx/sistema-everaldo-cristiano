"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState, useTransition } from "react";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { adicionarFoto, removerFoto } from "@/app/actions/ordens";
import { Aviso } from "@/components/form";

type Foto = { id: string; dataUrl: string; legenda: string | null; etapa: string };

const LIMITE_LADO = 1280;
const QUALIDADE = 0.72;

export function EnvioFotos({
  ordemId,
  fotos,
}: {
  ordemId: string;
  fotos: Foto[];
}) {
  const [etapa, setEtapa] = useState<"ANTES" | "DEPOIS">("DEPOIS");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;

    setErro(null);
    try {
      const dataUrl = await comprimir(arquivo);
      const dados = new FormData();
      dados.set("ordemId", ordemId);
      dados.set("dataUrl", dataUrl);
      dados.set("etapa", etapa);
      iniciar(() => void adicionarFoto(dados));
    } catch {
      setErro("Não foi possível processar a imagem. Tente outra foto.");
    }
  }

  return (
    <section className="cartao p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-texto">Registro fotográfico</h2>
        <div className="flex gap-1 rounded-lg bg-[#f1f4f3] p-1">
          {(["ANTES", "DEPOIS"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setEtapa(v)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                etapa === v ? "bg-marca-500 text-white" : "text-suave"
              }`}
            >
              {v === "ANTES" ? "Antes" : "Depois"}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-1 text-[11px] leading-relaxed text-suave">
        As fotos comprovam a entrega e ficam anexadas à OS no painel do
        administrador.
      </p>

      {erro && (
        <div className="mt-3">
          <Aviso tipo="erro">{erro}</Aviso>
        </div>
      )}

      {fotos.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {fotos.map((f) => (
            <li key={f.id} className="group relative overflow-hidden rounded-xl border border-borda">
              <img
                src={f.dataUrl}
                alt={f.legenda ?? "Registro do serviço"}
                className="aspect-square w-full object-cover"
              />
              <span className="absolute left-1 top-1 rounded-md bg-marca-950/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                {f.etapa === "ANTES" ? "ANTES" : "DEPOIS"}
              </span>
              <form action={removerFoto} className="absolute right-1 top-1">
                <input type="hidden" name="id" value={f.id} />
                <button
                  type="submit"
                  aria-label="Remover foto"
                  className="grid h-6 w-6 place-items-center rounded-md bg-marca-950/70 text-white transition-colors hover:bg-rose-600"
                >
                  <Trash2 size={12} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={aoEscolher}
        className="sr-only"
        aria-label="Adicionar foto do serviço"
      />

      <button
        type="button"
        disabled={pendente}
        onClick={() => inputRef.current?.click()}
        className="btn btn-claro mt-3 w-full !py-3"
      >
        {pendente ? (
          <Loader2 size={17} className="animate-spin" />
        ) : fotos.length > 0 ? (
          <ImagePlus size={17} />
        ) : (
          <Camera size={17} />
        )}
        {pendente ? "Enviando…" : `Adicionar foto (${etapa === "ANTES" ? "antes" : "depois"})`}
      </button>
    </section>
  );
}

/**
 * Reduz a foto no próprio aparelho antes de enviar: fotos de celular passam
 * de 4 MB e o banco guarda a imagem embutida na OS.
 */
function comprimir(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("leitura"));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decodificação"));
      img.onload = () => {
        const escala = Math.min(1, LIMITE_LADO / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", QUALIDADE));
      };
      img.src = String(leitor.result);
    };
    leitor.readAsDataURL(arquivo);
  });
}
