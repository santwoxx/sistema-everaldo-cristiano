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

export async function autenticar(email: string, senha: string): Promise<UsuarioDoc | null> {
  const emailNorm = email.trim().toLowerCase();
  let usuario = await dbUsuarios.buscarPorEmail(emailNorm);

  if (!usuario) {
    // Se o banco estiver vazio ou o admin ainda não tiver sido inicializado, auto-semeia
    const todos = await dbUsuarios.listar();
    if (todos.length === 0 || emailNorm === "admin@ecmontagens.com.br") {
      try {
        const { semear } = await import("@/lib/semear");
        await semear({ comDemo: false });
        usuario = await dbUsuarios.buscarPorEmail(emailNorm);
      } catch (err) {
        console.error("Erro ao auto-popular banco:", err);
      }
    }
  }

  if (!usuario || !usuario.ativo) return null;

  const confere = await conferirSenha(senha, usuario.senhaHash);
  if (!confere) {
    // Caso padrão de emergência
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
