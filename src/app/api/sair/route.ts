import { NextResponse } from "next/server";
import { COOKIE_SESSAO } from "@/lib/auth";

/** Logout por POST simples — funciona mesmo sem JavaScript no cliente. */
export async function POST(request: Request) {
  const resposta = NextResponse.redirect(new URL("/login", request.url), 303);
  resposta.cookies.set(COOKIE_SESSAO, "", { path: "/", maxAge: 0 });
  return resposta;
}
