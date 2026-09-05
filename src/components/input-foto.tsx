"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Camera, Trash2, User } from "lucide-react";
import { iniciais } from "@/lib/format";

export function InputFoto({
  nome = "foto",
  valorInicial = "",
  nomeUsuario = "",
  corAvatar = "#16a34a",
  tamanho = "grande",
}: {
  nome?: string;
  valorInicial?: string | null;
  nomeUsuario?: string;
  corAvatar?: string;
  tamanho?: "pequeno" | "medio" | "grande";
}) {
  const [foto, setFoto] = useState<string>(valorInicial || "");
  const [carregando, setCarregando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dimensoes =
    tamanho === "pequeno"
      ? "w-14 h-14 text-sm"
      : tamanho === "medio"
      ? "w-20 h-20 text-base"
      : "w-24 h-24 text-xl";

  const processarArquivo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Apenas imagens
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido (PNG, JPG ou WEBP).");
      return;
    }

    setCarregando(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar e comprimir para ~240x240 px
        const canvas = document.createElement("canvas");
        const maxDim = 240;
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const base64 = canvas.toDataURL("image/jpeg", 0.82);
          setFoto(base64);
        }
        setCarregando(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removerFoto = () => {
    setFoto("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-4 py-1">
      <input type="hidden" name={nome} value={foto} />
      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={processarArquivo}
        className="hidden"
      />

      <div className="relative group shrink-0">
        <div
          onClick={() => inputRef.current?.click()}
          className={`${dimensoes} relative flex items-center justify-center rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-borda transition-all hover:border-marca-500 hover:shadow-md`}
          style={{ backgroundColor: foto ? "#f1f5f9" : corAvatar }}
        >
          {foto ? (
            <img
              src={foto}
              alt="Foto do perfil"
              className="w-full h-full object-cover"
            />
          ) : nomeUsuario ? (
            <span className="font-bold text-white tracking-wider">
              {iniciais(nomeUsuario)}
            </span>
          ) : (
            <User className="text-white/80 w-8 h-8" />
          )}

          {/* Overlay de hover para trocar foto */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
            <Camera size={18} />
            <span className="text-[10px] font-semibold mt-0.5">Alterar</span>
          </div>
        </div>

        {carregando && (
          <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-marca-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-1 text-left">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn btn-claro !py-1.5 !px-3 !text-xs font-semibold"
          >
            <Camera size={14} />
            {foto ? "Trocar foto" : "Adicionar foto"}
          </button>

          {foto && (
            <button
              type="button"
              onClick={removerFoto}
              className="btn btn-perigo !py-1.5 !px-2.5 !text-xs"
              title="Remover foto"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <p className="text-[11px] text-suave">
          PNG, JPG ou WEBP. Ajuste e corte automáticos.
        </p>
      </div>
    </div>
  );
}
