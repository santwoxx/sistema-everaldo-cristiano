import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShellAdmin } from "@/components/shell-admin";
import { BotaoRestaurarDemo } from "@/components/restaurar-demo";

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await exigirAdmin();

  const [naoLidas, orcamentosNovos] = await Promise.all([
    prisma.notificacao.count({ where: { lida: false } }),
    prisma.orcamento.count({ where: { status: "NOVO" } }),
  ]);

  return (
    <ShellAdmin
      sessao={sessao}
      naoLidas={naoLidas}
      orcamentosNovos={orcamentosNovos}
      restaurarDemo={<BotaoRestaurarDemo />}
    >
      {children}
    </ShellAdmin>
  );
}
