/** Formatadores pt-BR compartilhados entre server e client components. */

const FUSO = "America/Sao_Paulo";

export const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function moeda(valor: number | null | undefined): string {
  return brl.format(Number(valor ?? 0));
}

/** Aceita "1.234,56", "1234.56" ou "R$ 1.234,56" e devolve um number. */
export function paraNumero(entrada: unknown): number {
  if (typeof entrada === "number") return Number.isFinite(entrada) ? entrada : 0;
  if (typeof entrada !== "string") return 0;
  const limpo = entrada.replace(/[^\d,.-]/g, "").trim();
  if (!limpo) return 0;
  const temVirgula = limpo.includes(",");
  const normalizado = temVirgula
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  const n = Number.parseFloat(normalizado);
  return Number.isFinite(n) ? n : 0;
}

export function data(valor: Date | string | null | undefined): string {
  if (!valor) return "--";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(d.getTime())) return "--";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: FUSO }).format(d);
}

export function dataHora(valor: Date | string | null | undefined): string {
  if (!valor) return "--";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(d.getTime())) return "--";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: FUSO,
  }).format(d);
}

export function dataExtenso(valor: Date | string | null | undefined): string {
  if (!valor) return "--";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(d.getTime())) return "--";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: FUSO }).format(d);
}

/** Valor para <input type="date"> / "datetime-local". */
export function paraInputData(valor: Date | string | null | undefined): string {
  if (!valor) return "";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

export function porcentagem(valor: number): string {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(valor)}%`;
}

export function telefone(valor: string | null | undefined): string {
  if (!valor) return "--";
  const d = valor.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return valor;
}

/** Somente digitos, pronto para link do WhatsApp (com DDI 55). */
export function whatsapp(valor: string | null | undefined): string {
  const d = (valor ?? "").replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("55") ? d : `55${d}`;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function osNumero(numero: number): string {
  return `OS-${String(numero).padStart(4, "0")}`;
}

export function orcNumero(numero: number): string {
  return `ORC-${String(numero).padStart(4, "0")}`;
}
