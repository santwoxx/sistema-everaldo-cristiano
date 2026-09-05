import { exigirAdmin } from "@/lib/auth";
import { dbNotificacoes, dbOrcamentos } from "@/lib/firestore";
import { ShellAdmin } from "@/components/shell-admin";
import { BotaoRestaurarDemo } from "@/components/restaurar-demo";

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await exigirAdmin();

  const [naoLidas, todosOrcamentos] = await Promise.all([
    dbNotificacoes.contarNaoLidas(),
    dbOrcamentos.listar({ status: "NOVO" }),
  ]);

  return (
    <ShellAdmin
      sessao={sessao}
      naoLidas={naoLidas}
      orcamentosNovos={todosOrcamentos.length}
      restaurarDemo={<BotaoRestaurarDemo />}
    >
      {children}
    </ShellAdmin>
  );
}
