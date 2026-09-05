/**
 * Carga de dados: cria o administrador inicial e, opcionalmente, um cenário
 * de demonstração completo. É usada tanto pelo `npm run seed` quanto pelo
 * botão "Restaurar Demonstração" do painel.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

const token = (b = 12) => randomBytes(b).toString("base64url");

/** Traço de assinatura ilustrativo (somente para os dados de demonstração). */
function assinaturaDemo(semente: string): string {
  const n = [...semente].reduce((a, c) => a + c.charCodeAt(0), 0);
  const p = (i: number) => 20 + ((n * (i + 3)) % 55);
  const d = `M8 ${p(1)} C ${p(2)} 8, ${p(3)} 62, ${90} ${p(4)} S ${150} ${p(5)}, ${190} ${p(6)} S ${250} ${p(2)}, ${292} ${p(3)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80" viewBox="0 0 300 80"><path d="${d}" fill="none" stroke="#0f172a" stroke-width="2.6" stroke-linecap="round"/><path d="M40 ${p(6)} q 40 -18 92 -4" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const hash = (v: string) => createHash("sha256").update(v).digest("hex");

/** Datas relativas a hoje, para o painel sempre parecer atual. */
const diasAtras = (d: number) => new Date(Date.now() - d * 86_400_000);
const diasAFrente = (d: number) => new Date(Date.now() + d * 86_400_000);

export async function limparBase(prisma: PrismaClient) {
  await prisma.assinatura.deleteMany();
  await prisma.fotoOrdem.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.itemOrdem.deleteMany();
  await prisma.lancamento.deleteMany();
  await prisma.ordemServico.deleteMany();
  await prisma.orcamento.deleteMany();
  await prisma.linkPublico.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();
}

export async function semear(
  prisma: PrismaClient,
  opcoes: { comDemo?: boolean } = {}
) {
  const comDemo = opcoes.comDemo ?? true;

  const senhaPadrao = process.env.ADMIN_SENHA || "ecmontagens2024";
  const senhaHash = await bcrypt.hash(senhaPadrao, 10);

  /* ---------------------------------------------------------------- Equipe */
  const admin = await prisma.usuario.create({
    data: {
      nome: process.env.ADMIN_NOME || "Edson Cristiano",
      email: (process.env.ADMIN_EMAIL || "admin@ecmontagens.com.br").toLowerCase(),
      senhaHash,
      papel: "ADMIN",
      telefone: "(11) 98877-1200",
      comissaoPadrao: 0,
      corAvatar: "#0f6a31",
    },
  });

  if (!comDemo) {
    await prisma.config.upsert({
      where: { chave: "empresa" },
      create: { chave: "empresa", valor: "EC Montagens de Móveis" },
      update: {},
    });
    return { admin, senha: senhaPadrao };
  }

  const [everaldo, rafael] = await Promise.all([
    prisma.usuario.create({
      data: {
        nome: "Everaldo Souza",
        email: "montador@ecmontagens.com.br",
        senhaHash,
        papel: "MONTADOR",
        telefone: "(11) 99461-3388",
        documento: "184.552.339-04",
        comissaoPadrao: 35,
        corAvatar: "#ea580c",
      },
    }),
    prisma.usuario.create({
      data: {
        nome: "Rafael Lima",
        email: "rafael@ecmontagens.com.br",
        senhaHash,
        papel: "MONTADOR",
        telefone: "(11) 99120-7745",
        comissaoPadrao: 30,
        corAvatar: "#0891b2",
      },
    }),
  ]);

  /* -------------------------------------------------------------- Clientes */
  const clientes = await Promise.all(
    [
      {
        nome: "Marina Albuquerque",
        telefone: "(11) 99812-4477",
        email: "marina.alb@gmail.com",
        documento: "327.884.910-22",
        cep: "04532-060",
        endereco: "Rua Jerônimo da Veiga",
        numero: "428",
        complemento: "Apto 132",
        bairro: "Itaim Bibi",
        cidade: "São Paulo",
        estado: "SP",
      },
      {
        nome: "Carlos Eduardo Prado",
        telefone: "(11) 97744-2019",
        email: "cadu.prado@outlook.com",
        cep: "09080-410",
        endereco: "Av. Industrial",
        numero: "1120",
        bairro: "Jardim",
        cidade: "Santo André",
        estado: "SP",
      },
      {
        nome: "Móveis Bertolini — Loja Tatuapé",
        telefone: "(11) 3255-8890",
        email: "compras@bertolini.com.br",
        documento: "18.442.907/0001-31",
        endereco: "Rua Serra de Bragança",
        numero: "877",
        bairro: "Tatuapé",
        cidade: "São Paulo",
        estado: "SP",
        observacoes: "Cliente recorrente. Faturamento em 15 dias após a entrega.",
      },
      {
        nome: "Juliana Ferraz",
        telefone: "(11) 98123-7766",
        email: "ju.ferraz@gmail.com",
        cep: "06455-030",
        endereco: "Alameda Rio Negro",
        numero: "500",
        bairro: "Alphaville",
        cidade: "Barueri",
        estado: "SP",
      },
      {
        nome: "Anderson Ribeiro",
        telefone: "(11) 96500-1188",
        cidade: "Guarulhos",
        estado: "SP",
        endereco: "Rua Tapajós, 210",
      },
    ].map((data) => prisma.cliente.create({ data }))
  );

  /* --------------------------------------------------------- Link público */
  const link = await prisma.linkPublico.create({
    data: {
      token: token(12),
      titulo: "Solicitação de Orçamento — EC Montagens",
      mensagem:
        "Preencha os dados do seu móvel e retornamos com o orçamento em até 24 horas úteis.",
      criadoPorId: admin.id,
      acessos: 34,
      envios: 3,
    },
  });

  /* ------------------------------------------------------------ Orçamentos */
  await prisma.orcamento.createMany({
    data: [
      {
        numero: 1,
        nomeContato: "Patrícia Nogueira",
        telefone: "(11) 99450-2211",
        email: "patricia.ng@gmail.com",
        tipoServico: "PLANEJADOS",
        descricao:
          "Cozinha planejada completa: 8 módulos aéreos, 6 balcões, torre quente e painel para TV na sala integrada. Móveis já entregues, aguardando montagem.",
        quantidadeItens: 15,
        cidade: "São Paulo",
        estado: "SP",
        endereco: "Rua Cardeal Arcoverde, 1290 — Pinheiros",
        prazoDesejado: diasAFrente(9),
        status: "NOVO",
        linkId: link.id,
        criadoEm: diasAtras(1),
      },
      {
        numero: 2,
        nomeContato: "Thiago Menezes",
        telefone: "(11) 98330-1177",
        tipoServico: "MONTAGEM",
        descricao:
          "Guarda-roupa 6 portas com espelho e uma cômoda de 5 gavetas. Produtos comprados em loja online, ainda na caixa.",
        quantidadeItens: 2,
        cidade: "São Bernardo do Campo",
        estado: "SP",
        prazoDesejado: diasAFrente(4),
        status: "NOVO",
        linkId: link.id,
        criadoEm: diasAtras(2),
      },
      {
        numero: 3,
        nomeContato: "Luciana Barros",
        telefone: "(11) 97001-4455",
        email: "lu.barros@empresa.com.br",
        tipoServico: "DESMONTAGEM",
        descricao:
          "Desmontagem de escritório para mudança: 12 estações de trabalho, 4 armários altos e 2 mesas de reunião. Remontagem no novo endereço na semana seguinte.",
        quantidadeItens: 18,
        cidade: "São Paulo",
        estado: "SP",
        prazoDesejado: diasAFrente(15),
        status: "PROPOSTA_ENVIADA",
        valorProposto: 4800,
        observacoesInternas: "Proposta enviada por WhatsApp. Aguardando aprovação da diretoria.",
        respondidoEm: diasAtras(1),
        linkId: link.id,
        criadoEm: diasAtras(5),
      },
    ],
  });

  /* -------------------------------------------------- Ordens e financeiro */
  const checklistPadrao = [
    "Conferência das peças e ferragens recebidas",
    "Montagem executada conforme o projeto",
    "Nivelamento e fixação na parede",
    "Portas, gavetas e corrediças ajustadas",
    "Limpeza do local e retirada das embalagens",
    "Cliente orientado sobre uso e conservação",
  ];

  const criarChecklist = (concluidos: number) => ({
    create: checklistPadrao.map((descricao, i) => ({
      descricao,
      ordemIndex: i,
      concluido: i < concluidos,
    })),
  });

  // 1) Concluída, assinada e paga.
  const os1 = await prisma.ordemServico.create({
    data: {
      numero: 1,
      titulo: "Montagem de cozinha planejada — 14 módulos",
      descricao:
        "Cozinha completa com torre quente, coifa e ilha central. Fixação em drywall com buchas reforçadas.",
      clienteId: clientes[0].id,
      montadorId: everaldo.id,
      endereco: "Rua Jerônimo da Veiga, 428 — Apto 132",
      cidade: "São Paulo",
      status: "CONCLUIDA",
      dataAgendada: diasAtras(12),
      dataInicio: diasAtras(12),
      dataConclusao: diasAtras(11),
      comissaoPercent: 35,
      formaPagamento: "PIX",
      pago: true,
      tokenAssinatura: token(),
      avaliacaoNota: 5,
      avaliacaoComentario: "Serviço impecável, montagem perfeita e local entregue limpo.",
      checklist: criarChecklist(6),
      itens: {
        create: [
          { descricao: "Montagem de módulos aéreos", quantidade: 8, valorUnitario: 180 },
          { descricao: "Montagem de balcões e gaveteiros", quantidade: 6, valorUnitario: 210 },
          { descricao: "Instalação de coifa e torre quente", quantidade: 1, valorUnitario: 450 },
        ],
      },
    },
  });

  // 2) Concluída e assinada, porém ainda não recebida (entra em "A receber").
  const os2 = await prisma.ordemServico.create({
    data: {
      numero: 2,
      titulo: "Montagem de 12 estações de trabalho",
      descricao: "Escritório corporativo — montagem de estações, painéis divisórios e gaveteiros.",
      clienteId: clientes[2].id,
      montadorId: rafael.id,
      endereco: "Rua Serra de Bragança, 877",
      cidade: "São Paulo",
      status: "CONCLUIDA",
      dataAgendada: diasAtras(4),
      dataInicio: diasAtras(4),
      dataConclusao: diasAtras(3),
      comissaoPercent: 30,
      formaPagamento: "BOLETO",
      pago: false,
      tokenAssinatura: token(),
      avaliacaoNota: 5,
      checklist: criarChecklist(6),
      itens: {
        create: [
          { descricao: "Montagem de estação de trabalho", quantidade: 12, valorUnitario: 165 },
          { descricao: "Instalação de painel divisório", quantidade: 8, valorUnitario: 95 },
        ],
      },
    },
  });

  // 3) Em andamento — falta assinar.
  const os3 = await prisma.ordemServico.create({
    data: {
      numero: 3,
      titulo: "Guarda-roupa 6 portas + cômoda",
      descricao: "Montagem no dormitório principal, com espelho e fixação de puxadores.",
      clienteId: clientes[1].id,
      montadorId: everaldo.id,
      endereco: "Av. Industrial, 1120",
      cidade: "Santo André",
      status: "EM_ANDAMENTO",
      dataAgendada: new Date(),
      dataInicio: new Date(),
      comissaoPercent: 35,
      formaPagamento: "PIX",
      tokenAssinatura: token(),
      checklist: criarChecklist(3),
      itens: {
        create: [
          { descricao: "Montagem de guarda-roupa 6 portas", quantidade: 1, valorUnitario: 620 },
          { descricao: "Montagem de cômoda 5 gavetas", quantidade: 1, valorUnitario: 190 },
        ],
      },
    },
  });

  // 4) Agendada para os próximos dias.
  const os4 = await prisma.ordemServico.create({
    data: {
      numero: 4,
      titulo: "Home theater e painel de TV",
      descricao: "Painel ripado 2,80 m com nicho e rack suspenso.",
      clienteId: clientes[3].id,
      montadorId: rafael.id,
      endereco: "Alameda Rio Negro, 500",
      cidade: "Barueri",
      status: "AGENDADA",
      dataAgendada: diasAFrente(3),
      comissaoPercent: 30,
      formaPagamento: "CARTAO",
      tokenAssinatura: token(),
      checklist: criarChecklist(0),
      itens: {
        create: [
          { descricao: "Instalação de painel ripado", quantidade: 1, valorUnitario: 780 },
          { descricao: "Montagem de rack suspenso", quantidade: 1, valorUnitario: 240 },
        ],
      },
    },
  });

  // 5) Aguardando a assinatura do cliente (só o montador assinou).
  const os5 = await prisma.ordemServico.create({
    data: {
      numero: 5,
      titulo: "Reparo de corrediças e portas de armário",
      descricao: "Substituição de 6 corrediças telescópicas e regulagem de 4 portas.",
      clienteId: clientes[4].id,
      montadorId: everaldo.id,
      endereco: "Rua Tapajós, 210",
      cidade: "Guarulhos",
      status: "AGUARDANDO_ASSINATURA",
      dataAgendada: diasAtras(1),
      dataInicio: diasAtras(1),
      comissaoPercent: 35,
      formaPagamento: "DINHEIRO",
      tokenAssinatura: token(),
      checklist: criarChecklist(6),
      itens: {
        create: [{ descricao: "Reparo e regulagem de armário", quantidade: 1, valorUnitario: 380 }],
      },
    },
  });

  // 6) Concluída, assinada e paga — dormitório completo.
  const os6 = await prisma.ordemServico.create({
    data: {
      numero: 6,
      titulo: "Dormitório completo — guarda-roupa, cama box e criados",
      descricao:
        "Guarda-roupa 8 portas com maleiro, cabeceira estofada, dois criados-mudos e cômoda.",
      clienteId: clientes[3].id,
      montadorId: rafael.id,
      endereco: "Alameda Rio Negro, 500",
      cidade: "Barueri",
      status: "CONCLUIDA",
      dataAgendada: diasAtras(7),
      dataInicio: diasAtras(7),
      dataConclusao: diasAtras(7),
      comissaoPercent: 30,
      formaPagamento: "PIX",
      pago: true,
      tokenAssinatura: token(),
      avaliacaoNota: 5,
      avaliacaoComentario: "Pontualidade e capricho do começo ao fim. Recomendo!",
      checklist: criarChecklist(6),
      itens: {
        create: [
          { descricao: "Montagem de guarda-roupa 8 portas", quantidade: 1, valorUnitario: 1180 },
          { descricao: "Montagem de cama box com cabeceira", quantidade: 1, valorUnitario: 420 },
          { descricao: "Montagem de criado-mudo", quantidade: 2, valorUnitario: 145 },
          { descricao: "Montagem de cômoda 6 gavetas", quantidade: 1, valorUnitario: 260 },
          { descricao: "Fixação e nivelamento em parede de alvenaria", quantidade: 1, valorUnitario: 320 },
        ],
      },
    },
  });

  // Recalcula os totais a partir dos itens de cada OS.
  for (const os of [os1, os2, os3, os4, os5, os6]) {
    const itens = await prisma.itemOrdem.findMany({ where: { ordemId: os.id } });
    const valorTotal = itens.reduce((a, i) => a + i.quantidade * i.valorUnitario, 0);
    await prisma.ordemServico.update({
      where: { id: os.id },
      data: {
        valorTotal,
        comissaoValor: Number(((valorTotal * os.comissaoPercent) / 100).toFixed(2)),
      },
    });
  }

  /* ----------------------------------------------------------- Assinaturas */
  const assinaturas = [
    { ordem: os1, tipo: "MONTADOR", nome: "Everaldo Souza", doc: "184.552.339-04", quando: diasAtras(11) },
    { ordem: os1, tipo: "CLIENTE", nome: "Marina Albuquerque", doc: "327.884.910-22", quando: diasAtras(11) },
    { ordem: os2, tipo: "MONTADOR", nome: "Rafael Lima", doc: null, quando: diasAtras(3) },
    { ordem: os2, tipo: "CLIENTE", nome: "Sandra Bertolini", doc: "18.442.907/0001-31", quando: diasAtras(3) },
    { ordem: os5, tipo: "MONTADOR", nome: "Everaldo Souza", doc: "184.552.339-04", quando: diasAtras(1) },
    { ordem: os6, tipo: "MONTADOR", nome: "Rafael Lima", doc: null, quando: diasAtras(7) },
    { ordem: os6, tipo: "CLIENTE", nome: "Juliana Ferraz", doc: null, quando: diasAtras(7) },
  ];

  for (const a of assinaturas) {
    const imagem = assinaturaDemo(a.nome + a.tipo);
    await prisma.assinatura.create({
      data: {
        ordemId: a.ordem.id,
        tipo: a.tipo,
        nome: a.nome,
        documento: a.doc,
        imagem,
        assinadoEm: a.quando,
        ip: "189.45.112.7",
        userAgent: "Mozilla/5.0 (Android 14; Mobile) AppleWebKit/537.36 Chrome/126",
        hash: hash(`${a.ordem.id}|${a.tipo}|${a.nome}|${a.quando.toISOString()}`),
      },
    });
  }

  /* ------------------------------------------------------------ Financeiro */
  const os1Final = await prisma.ordemServico.findUnique({ where: { id: os1.id } });
  const os2Final = await prisma.ordemServico.findUnique({ where: { id: os2.id } });
  const os6Final = await prisma.ordemServico.findUnique({ where: { id: os6.id } });

  await prisma.lancamento.createMany({
    data: [
      {
        tipo: "RECEITA",
        categoria: "SERVICO",
        descricao: `Montagem de cozinha planejada — OS-${String(os1.numero).padStart(4, "0")} · Marina Albuquerque`,
        valor: os1Final?.valorTotal ?? 0,
        data: diasAtras(11),
        status: "CONFIRMADO",
        formaPagamento: "PIX",
        automatico: true,
        ordemId: os1.id,
      },
      {
        tipo: "DESPESA",
        categoria: "COMISSAO",
        descricao: `Comissão Everaldo Souza (35%) — OS-${String(os1.numero).padStart(4, "0")}`,
        valor: os1Final?.comissaoValor ?? 0,
        data: diasAtras(11),
        status: "CONFIRMADO",
        formaPagamento: "PIX",
        automatico: true,
        ordemId: os1.id,
        montadorId: everaldo.id,
      },
      {
        tipo: "RECEITA",
        categoria: "SERVICO",
        descricao: `Montagem de 12 estações — OS-${String(os2.numero).padStart(4, "0")} · Móveis Bertolini`,
        valor: os2Final?.valorTotal ?? 0,
        data: diasAtras(3),
        status: "PENDENTE",
        formaPagamento: "BOLETO",
        automatico: true,
        ordemId: os2.id,
      },
      {
        tipo: "DESPESA",
        categoria: "COMISSAO",
        descricao: `Comissão Rafael Lima (30%) — OS-${String(os2.numero).padStart(4, "0")}`,
        valor: os2Final?.comissaoValor ?? 0,
        data: diasAtras(3),
        status: "CONFIRMADO",
        formaPagamento: "PIX",
        automatico: true,
        ordemId: os2.id,
        montadorId: rafael.id,
      },
      {
        tipo: "RECEITA",
        categoria: "SERVICO",
        descricao: `Dormitório completo — OS-${String(os6.numero).padStart(4, "0")} · Juliana Ferraz`,
        valor: os6Final?.valorTotal ?? 0,
        data: diasAtras(7),
        status: "CONFIRMADO",
        formaPagamento: "PIX",
        automatico: true,
        ordemId: os6.id,
      },
      {
        tipo: "DESPESA",
        categoria: "COMISSAO",
        descricao: `Comissão Rafael Lima (30%) — OS-${String(os6.numero).padStart(4, "0")}`,
        valor: os6Final?.comissaoValor ?? 0,
        data: diasAtras(7),
        status: "CONFIRMADO",
        formaPagamento: "PIX",
        automatico: true,
        ordemId: os6.id,
        montadorId: rafael.id,
      },
      {
        tipo: "DESPESA",
        categoria: "TRANSPORTE",
        descricao: "Combustível e pedágio — atendimentos da semana",
        valor: 418.9,
        data: diasAtras(6),
        status: "CONFIRMADO",
        formaPagamento: "CARTAO",
      },
      {
        tipo: "DESPESA",
        categoria: "FERRAMENTA",
        descricao: "Parafusadeira de impacto 20V + jogo de brocas",
        valor: 899,
        data: diasAtras(9),
        status: "CONFIRMADO",
        formaPagamento: "CARTAO",
      },
      {
        tipo: "DESPESA",
        categoria: "MATERIAL",
        descricao: "Buchas, parafusos, cantoneiras e fita dupla-face",
        valor: 246.5,
        data: diasAtras(8),
        status: "CONFIRMADO",
        formaPagamento: "DINHEIRO",
      },
      {
        tipo: "DESPESA",
        categoria: "ADMINISTRATIVO",
        descricao: "Plano de celular e internet móvel da equipe",
        valor: 189.9,
        data: diasAtras(15),
        status: "CONFIRMADO",
        formaPagamento: "BOLETO",
      },
      {
        tipo: "RECEITA",
        categoria: "OUTRO",
        descricao: "Venda de acessórios e ferragens ao cliente",
        valor: 320,
        data: diasAtras(7),
        status: "CONFIRMADO",
        formaPagamento: "PIX",
      },
    ],
  });

  /* ---------------------------------------------------------- Notificações */
  await prisma.notificacao.createMany({
    data: [
      {
        tipo: "ORCAMENTO",
        titulo: "Novo orçamento de Patrícia Nogueira",
        mensagem: "Móveis planejados · 15 item(ns) · (11) 99450-2211",
        link: "/orcamentos",
        criadoEm: diasAtras(1),
      },
      {
        tipo: "ORCAMENTO",
        titulo: "Novo orçamento de Thiago Menezes",
        mensagem: "Montagem de móveis · 2 item(ns) · (11) 98330-1177",
        link: "/orcamentos",
        criadoEm: diasAtras(2),
      },
      {
        tipo: "ASSINATURA",
        titulo: `Assinatura registrada · OS-${String(os5.numero).padStart(4, "0")}`,
        mensagem: "O montador Everaldo Souza assinou. Aguardando a assinatura do cliente.",
        link: `/ordens/${os5.id}`,
        criadoEm: diasAtras(1),
      },
      {
        tipo: "OS_CONCLUIDA",
        titulo: `OS-${String(os2.numero).padStart(4, "0")} concluída e assinada`,
        mensagem: "Móveis Bertolini — montador e cliente assinaram digitalmente.",
        link: `/ordens/${os2.id}`,
        lida: true,
        criadoEm: diasAtras(3),
      },
    ],
  });

  await prisma.config.upsert({
    where: { chave: "empresa" },
    create: { chave: "empresa", valor: "EC Montagens de Móveis" },
    update: {},
  });

  return { admin, senha: senhaPadrao };
}
