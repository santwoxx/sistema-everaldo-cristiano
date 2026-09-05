"use client";

import { Printer } from "lucide-react";

export function BotaoImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-principal">
      <Printer size={15} /> Imprimir / Salvar PDF
    </button>
  );
}
