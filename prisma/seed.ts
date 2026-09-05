import { limparBase, semear } from "../src/lib/semear";
import { dbUsuarios } from "../src/lib/firestore";

async function main() {
  const usuarios = await dbUsuarios.listar();
  const forcar = process.argv.includes("--force");

  if (usuarios.length > 0 && !forcar) {
    console.log(
      "\n  Firestore já possui usuários — nada a fazer.\n" +
        "  Use `npx tsx prisma/seed.ts --force` para recriar do zero.\n"
    );
    return;
  }

  if (forcar) {
    console.log("  Limpando o Firestore…");
    await limparBase();
  }

  const comDemo = !process.argv.includes("--limpo");
  const { admin, senha } = await semear({ comDemo });

  console.log(`
  ┌──────────────────────────────────────────────────────────┐
  │  EC MONTAGENS DE MOVEIS - base pronta no Firestore       │
  ├──────────────────────────────────────────────────────────┤
  │  Administrador : ${admin.email.padEnd(38)}│
  │  Senha         : ${senha.padEnd(38)}│
  ${comDemo ? "│  Montador      : montador@ecmontagens.com.br              │\n  │  Dados de demonstracao carregados no Firebase!           │" : "│  Base criada sem dados de demonstracao.                  │"}
  └──────────────────────────────────────────────────────────┘

  Troque a senha do administrador no primeiro acesso (Equipe & Logins).
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
