/* eslint-disable @next/next/no-img-element */

/**
 * Logotipo da EC Montagens.
 * A arte fica em /public/logo.svg — para usar o arquivo oficial da empresa,
 * basta substituir esse arquivo (SVG ou PNG, ajustando a extensao aqui).
 */
export function Selo({ tamanho = 40 }: { tamanho?: number }) {
  return (
    <img
      src="/logo.svg"
      alt="EC Montagens de Móveis"
      width={tamanho}
      height={tamanho}
      className="shrink-0 rounded-full"
      style={{ width: tamanho, height: tamanho }}
    />
  );
}

export function Marca({
  tamanho = 40,
  claro = false,
  compacto = false,
}: {
  tamanho?: number;
  claro?: boolean;
  compacto?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Selo tamanho={tamanho} />
      {!compacto && (
        <div className="leading-none">
          <div
            className={`text-[15px] font-extrabold tracking-tight ${
              claro ? "text-white" : "text-marca-800"
            }`}
          >
            EC MONTAGENS
          </div>
          <div
            className={`mt-1 text-[8.5px] font-semibold uppercase leading-[1.35] tracking-[0.12em] ${
              claro ? "text-marca-100/80" : "text-marca-500/80"
            }`}
          >
            Qualidade • Detalhes
            <br />
            Confiança
          </div>
        </div>
      )}
    </div>
  );
}
