import Link from "next/link";
import { Home, SearchX } from "lucide-react";
import { Marca } from "@/components/marca";

export default function NaoEncontrado() {
  return (
    <div className="grid min-h-dvh place-items-center bg-tela px-5">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center">
          <Marca tamanho={56} />
        </div>

        <span className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-full bg-white text-suave ring-1 ring-borda">
          <SearchX size={26} />
        </span>

        <h1 className="mt-4 text-xl font-bold tracking-tight text-texto">
          Página não encontrada
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-suave">
          O endereço que você tentou abrir não existe, expirou ou foi removido.
        </p>

        <Link href="/" className="btn btn-principal mt-6">
          <Home size={16} /> Voltar ao início
        </Link>
      </div>
    </div>
  );
}
