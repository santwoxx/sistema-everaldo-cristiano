"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, PenLine } from "lucide-react";

/**
 * Prancheta de assinatura sensivel a toque, mouse e caneta.
 * Desenha em alta densidade (devicePixelRatio) e exporta um PNG data-URL
 * recortado no traco, que e o que fica gravado na ordem de servico.
 */
export function AssinaturaPad({
  aoMudar,
  rotulo = "Assine no quadro abaixo",
  altura = 190,
}: {
  aoMudar: (dataUrl: string | null) => void;
  rotulo?: string;
  altura?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const ultimo = useRef<{ x: number; y: number } | null>(null);
  const temTraco = useRef(false);
  const [vazio, setVazio] = useState(true);

  /** Reajusta o buffer do canvas ao tamanho real em tela, preservando o traco. */
  const ajustarEscala = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const anterior = temTraco.current ? canvas.toDataURL() : null;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#0f172a";

    if (anterior) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = anterior;
    }
  }, []);

  useEffect(() => {
    ajustarEscala();
    const obs = new ResizeObserver(() => ajustarEscala());
    if (canvasRef.current) obs.observe(canvasRef.current);
    return () => obs.disconnect();
  }, [ajustarEscala]);

  function posicao(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function iniciar(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    desenhando.current = true;
    ultimo.current = posicao(e);
    // Um toque simples ja marca um ponto visivel.
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && ultimo.current) {
      ctx.beginPath();
      ctx.arc(ultimo.current.x, ultimo.current.y, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
    }
    marcarPreenchido();
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhando.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const atual = posicao(e);
    if (!ctx || !ultimo.current) return;

    ctx.beginPath();
    ctx.moveTo(ultimo.current.x, ultimo.current.y);
    ctx.lineTo(atual.x, atual.y);
    ctx.stroke();
    ultimo.current = atual;
  }

  function encerrar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhando.current) return;
    desenhando.current = false;
    ultimo.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ponteiro ja liberado */
    }
    exportar();
  }

  function marcarPreenchido() {
    if (!temTraco.current) {
      temTraco.current = true;
      setVazio(false);
    }
  }

  function exportar() {
    const canvas = canvasRef.current;
    if (!canvas || !temTraco.current) return aoMudar(null);
    aoMudar(recortar(canvas));
  }

  function limpar() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    temTraco.current = false;
    setVazio(true);
    aoMudar(null);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-suave">
          <PenLine size={13} /> {rotulo}
        </span>
        <button
          type="button"
          onClick={limpar}
          disabled={vazio}
          className="btn btn-fantasma !px-2 !py-1 !text-xs"
        >
          <Eraser size={13} /> Limpar
        </button>
      </div>

      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-borda bg-white">
        <canvas
          ref={canvasRef}
          style={{ height: altura }}
          className="area-assinatura block w-full"
          onPointerDown={iniciar}
          onPointerMove={mover}
          onPointerUp={encerrar}
          onPointerCancel={encerrar}
          onPointerLeave={encerrar}
        />
        {vazio && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
            <PenLine size={22} className="text-borda" />
            <span className="text-xs text-suave">
              Use o dedo, a caneta ou o mouse para assinar
            </span>
          </div>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-dashed border-borda"
        />
      </div>
    </div>
  );
}

/**
 * Recorta o retangulo do traco e devolve um PNG compacto com margem,
 * evitando gravar uma imagem enorme e quase toda transparente no banco.
 */
function recortar(origem: HTMLCanvasElement): string | null {
  const ctx = origem.getContext("2d");
  if (!ctx) return null;

  const { width, height } = origem;
  const dados = ctx.getImageData(0, 0, width, height).data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (dados[(y * width + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;

  const margem = Math.round(Math.min(width, height) * 0.04);
  minX = Math.max(0, minX - margem);
  minY = Math.max(0, minY - margem);
  maxX = Math.min(width - 1, maxX + margem);
  maxY = Math.min(height - 1, maxY + margem);

  const larguraCorte = maxX - minX + 1;
  const alturaCorte = maxY - minY + 1;

  // Limita a maior dimensao a 900px: nitidez suficiente para impressao em A4.
  const escala = Math.min(1, 900 / larguraCorte);
  const saida = document.createElement("canvas");
  saida.width = Math.max(1, Math.round(larguraCorte * escala));
  saida.height = Math.max(1, Math.round(alturaCorte * escala));

  const saidaCtx = saida.getContext("2d");
  if (!saidaCtx) return null;
  saidaCtx.imageSmoothingQuality = "high";
  saidaCtx.drawImage(
    origem,
    minX,
    minY,
    larguraCorte,
    alturaCorte,
    0,
    0,
    saida.width,
    saida.height
  );

  return saida.toDataURL("image/png");
}
