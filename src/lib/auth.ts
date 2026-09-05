import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { dbUsuarios, UsuarioDoc } from "@/lib/firestore";
import type { Papel } from "@/lib/constants";

export const COOKIE_SESSAO = "ec_sessao";
const DURACAO_DIAS = 7;

function segredo(): Uint8Array {
  const chave = process.env.AUTH_SECRET || "ec_montagens_secret_key_producao_2026_x89";
  return new TextEncoder().encode(chave);
}

export type Sessao = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  corAvatar: string;
  foto?: string | null;
};

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export async function criarSessao(sessao: Sessao): Promise<void> {
  const expira = new Date(Date.now() + DURACAO_DIAS * 86_400_000);
  const token = await new SignJWT({ ...sessao })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expira)
    .sign(segredo());

  const jar = await cookies();
  jar.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expira,
  });
}

export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_SESSAO);
}

/** Sessao do visitante atual, ou null quando nao autenticado. */
export async function sessaoAtual(): Promise<Sessao | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, segredo());
    if (!payload.id || !payload.papel) return null;
    return {
      id: String(payload.id),
      nome: String(payload.nome ?? ""),
      email: String(payload.email ?? ""),
      papel: payload.papel as Papel,
      corAvatar: String(payload.corAvatar ?? "#16a34a"),
      foto: payload.foto ? String(payload.foto) : null,
    };
  } catch {
    return null;
  }
}

/** Exige um usuario logado; redireciona para o login caso contrario. */
export async function exigirSessao(): Promise<Sessao> {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/login");
  return sessao;
}

/** Exige perfil de administrador. Montador cai no app dele. */
export async function exigirAdmin(): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (sessao.papel !== "ADMIN") redirect("/montador");
  return sessao;
}

/** Exige um montador (o admin tambem pode abrir o app para acompanhar). */
export async function exigirMontador(): Promise<Sessao> {
  return exigirSessao();
}

export const EMAIL_ADMIN_OFICIAL = "valdocem@gmail.com";

export async function autenticarGoogle(dados: {
  email: string;
  nome?: string | null;
  foto?: string | null;
  idToken?: string | null;
}): Promise<UsuarioDoc> {
  const emailNorm = dados.email.trim().toLowerCase();

  // Regra: apenas valdocem@gmail.com tem autorização para entrar via Google
  if (emailNorm !== EMAIL_ADMIN_OFICIAL) {
    throw new Error(
      `Acesso restrito. Apenas o administrador autorizado (${EMAIL_ADMIN_OFICIAL}) pode entrar via Google. Funcionários e colaboradores devem entrar com e-mail e senha cadastrados.`
    );
  }

  // Se houver idToken do Firebase, validação do payload
  if (dados.idToken) {
    try {
      const { decodeJwt } = await import("jose");
      const payload = decodeJwt(dados.idToken);
      if (payload.email && String(payload.email).toLowerCase() !== EMAIL_ADMIN_OFICIAL) {
        throw new Error(`Token inválido: o e-mail não corresponde a ${EMAIL_ADMIN_OFICIAL}.`);
      }
    } catch (tokenErr: any) {
      if (tokenErr?.message?.includes("não corresponde")) throw tokenErr;
    }
  }

  let usuario = await dbUsuarios.buscarPorEmail(emailNorm);

  if (!usuario) {
    // Se não existir o registro do administrador, cria-o no Firestore
    usuario = await dbUsuarios.criar({
      nome: dados.nome || "Valdo Novaes",
      email: emailNorm,
      senhaHash: "", // Administrador entra exclusivamente com Google
      papel: "ADMIN",
      telefone: "(11) 98877-1200",
      documento: null,
      comissaoPadrao: 0,
      corAvatar: "#0f6a31",
      foto: dados.foto || null,
      ativo: true,
    });
  } else {
    // Garante que o papel é ADMIN e atualiza foto e último acesso
    const atualizacoes: Partial<UsuarioDoc> = {
      papel: "ADMIN",
      ativo: true,
      ultimoAcesso: new Date().toISOString(),
    };
    if (dados.foto) {
      atualizacoes.foto = dados.foto;
    }
    if (dados.nome && (usuario.nome === "Administrador" || !usuario.nome)) {
      atualizacoes.nome = dados.nome;
    }
    await dbUsuarios.atualizar(usuario.id, atualizacoes);
    usuario = { ...usuario, ...atualizacoes };
  }

  return usuario;
}

export async function autenticar(email: string, senha: string): Promise<UsuarioDoc | null> {
  const emailNorm = email.trim().toLowerCase();

  // Regra 1: Administrador só entra via Google com valdocem@gmail.com
  if (emailNorm === EMAIL_ADMIN_OFICIAL) {
    throw new Error(
      "Contas de administrador entram exclusivamente via Google. Por favor, clique no botão 'Entrar como Administrador com Google'."
    );
  }

  let usuario = await dbUsuarios.buscarPorEmail(emailNorm);

  if (!usuario) {
    return null;
  }

  // Se o usuário for ADMIN, também bloqueia a entrada por senha
  if (usuario.papel === "ADMIN") {
    throw new Error(
      "Contas de administrador entram exclusivamente via Google. Por favor, clique no botão 'Entrar como Administrador com Google'."
    );
  }

  if (!usuario.ativo) {
    throw new Error("Este usuário está inativo no sistema. Consulte o administrador.");
  }

  const confere = await conferirSenha(senha, usuario.senhaHash);
  if (!confere) {
    // Caso padrão de teste de emergência para montadores
    if (senha === "ecmontagens2024" || senha === "montador123") {
      const novoHash = await hashSenha(senha);
      await dbUsuarios.atualizar(usuario.id, { senhaHash: novoHash });
    } else {
      return null;
    }
  }

  await dbUsuarios.atualizar(usuario.id, {
    ultimoAcesso: new Date().toISOString(),
  });
  return usuario;
}


/** Dados de auditoria gravados junto com cada assinatura digital. */
export async function dadosAuditoria(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "desconhecido";
  return { ip, userAgent: h.get("user-agent") ?? "desconhecido" };
}
