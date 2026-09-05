import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_SESSAO = "ec_sessao";

/** Rotas que qualquer visitante acessa sem login. */
const PUBLICAS = ["/", "/login", "/orcamento", "/assinar", "/comprovante", "/api/sair"];

/**
 * Primeira barreira de acesso: bloqueia rotas internas antes mesmo de
 * renderizar a página. As próprias páginas revalidam a sessão no servidor
 * (`exigirSessao`/`exigirAdmin`), então isto é defesa em profundidade.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLICAS.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_SESSAO)?.value;
  if (!token) return redirecionarParaLogin(request);

  const chave = process.env.AUTH_SECRET || "ec_montagens_secret_key_producao_2026_x89";

  try {
    await jwtVerify(token, new TextEncoder().encode(chave));
    return NextResponse.next();
  } catch {
    // Sessão inválida ou expirada: limpa o cookie e manda para o login.
    const resposta = redirecionarParaLogin(request);
    resposta.cookies.set(COOKIE_SESSAO, "", { path: "/", maxAge: 0 });
    return resposta;
  }
}

function redirecionarParaLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Tudo, menos:
     *  - assets internos do Next (_next/*)
     *  - arquivos estáticos da pasta public
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|icon.svg|manifest.webmanifest|robots.txt).*)",
  ],
};
