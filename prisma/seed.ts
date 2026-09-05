import { PrismaClient } from "@prisma/client";
import { limparBase, semear } from "../src/lib/semear";

const prisma = new PrismaClient();

async function main() {
  const jaTemUsuario = await prisma.usuario.count();
  const forcar = process.argv.includes("--force");

  if (jaTemUsuario > 0 && !forcar) {
    console.log(
      "\n  Banco já possui usuários — nada a fazer.\n" +
        "  Use `npx tsx prisma/seed.ts --force` para recriar do zero.\n"
    );
    return;
  }

  if (forcar) {
    console.log("  Limpando a base…");
    await limparBase(prisma);
  }

  const comDemo = !process.argv.includes("--limpo");
  const { admin, senha } = await semear(prisma, { comDemo });

  console.log(`
  ┌──────────────────────────────────────────────────────────┐
  │  EC MONTAGENS DE MOVEIS - base pronta                     │
  ├──────────────────────────────────────────────────────────┤
  │  Administrador : ${admin.email.padEnd(38)}│
  │  Senha         : ${senha.padEnd(38)}│
  ${comDemo ? "│  Montador      : montador@ecmontagens.com.br              │\n  │  Dados de demonstracao carregados.                        │" : "│  Base criada sem dados de demonstracao.                  │"}
  └──────────────────────────────────────────────────────────┘

  Troque a senha do administrador no primeiro acesso (Equipe & Logins).
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
