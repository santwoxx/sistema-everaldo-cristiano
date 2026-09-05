/**
 * Carga de dados no Firestore: cria o administrador inicial e, opcionalmente,
 * um cenário de demonstração completo.
 */
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import {
  dbUsuarios,
  dbClientes,
  dbOrdens,
  dbOrcamentos,
  dbLinks,
  dbLancamentos,
  dbNotificacoes,
  dbConfig,
  COLECOES,
  gerarId,
} from "./firestore";
import { getDocs, collection, writeBatch, doc } from "firebase/firestore";
import { firestore } from "./firebase";

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
const diasAtras = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const diasAFrente = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

export async function limparBase() {
  const colecoes = Object.values(COLECOES);
  for (const col of colecoes) {
    const snap = await getDocs(collection(firestore, col));
    if (!snap.empty) {
      const batch = writeBatch(firestore);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}

export async function semear(opcoes: { comDemo?: boolean } = {}) {
  const comDemo = opcoes.comDemo ?? true;

  const senhaPadrao = process.env.ADMIN_SENHA || "ecmontagens2024";
  const senhaHash = await bcrypt.hash(senhaPadrao, 10);
  const adminEmail = (process.env.ADMIN_EMAIL || "valdocem@gmail.com").toLowerCase();

  // Limpa a base antes de semear
  await limparBase();

  /* ---------------------------------------------------------------- Equipe */
  const admin = await dbUsuarios.criar({
    nome: process.env.ADMIN_NOME || "Valdo Novaes",
    email: adminEmail,
    senhaHash,
    papel: "ADMIN",
    telefone: "(11) 98877-1200",
    documento: null,
    comissaoPadrao: 0,
    corAvatar: "#0f6a31",
    ativo: true,
  });

  if (!comDemo) {
    await Promise.all([
      dbUsuarios.criar({
        nome: "Everaldo Souza",
        email: "montador@ecmontagens.com.br",
        senhaHash,
        papel: "MONTADOR",
        telefone: "(11) 99461-3388",
        documento: "184.552.339-04",
        comissaoPadrao: 35,
        corAvatar: "#ea580c",
        ativo: true,
      }),
      dbConfig.definir("empresa", "EC Montagens de Móveis"),
      dbLinks.criar({
        token: token(12),
        titulo: "Solicitação de Orçamento — EC Montagens",
        mensagem:
          "Preencha os dados do seu móvel e retornamos com o orçamento em até 24 horas úteis.",
        criadoPorId: admin.id,
        acessos: 0,
        envios: 0,
        ativo: true,
      }),
    ]);
    return { admin, senha: senhaPadrao };
  }

  const [everaldo, rafael] = await Promise.all([
    dbUsuarios.criar({
      nome: "Everaldo Souza",
      email: "montador@ecmontagens.com.br",
      senhaHash,
      papel: "MONTADOR",
      telefone: "(11) 99461-3388",
      documento: "184.552.339-04",
      comissaoPadrao: 35,
      corAvatar: "#ea580c",
      ativo: true,
    }),
    dbUsuarios.criar({
      nome: "Rafael Lima",
      email: "rafael@ecmontagens.com.br",
      senhaHash,
      papel: "MONTADOR",
      telefone: "(11) 99120-7745",
      documento: "221.789.440-11",
      comissaoPadrao: 30,
      corAvatar: "#0891b2",
      ativo: true,
    }),
  ]);

  /* -------------------------------------------------------------- Clientes */
  const clientes = await Promise.all([
    dbClientes.criar({
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
    }),
    dbClientes.criar({
      nome: "Carlos Eduardo Prado",
      telefone: "(11) 97744-2019",
      email: "cadu.prado@outlook.com",
      cep: "09080-410",
      endereco: "Av. Industrial",
      numero: "1120",
      bairro: "Jardim",
      cidade: "Santo André",
      estado: "SP",
    }),
    dbClientes.criar({
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
    }),
    dbClientes.criar({
      nome: "Juliana Ferraz",
      telefone: "(11) 98123-7766",
      email: "ju.ferraz@gmail.com",
      cep: "06455-030",
      endereco: "Alameda Rio Negro",
      numero: "500",
      bairro: "Alphaville",
      cidade: "Barueri",
      estado: "SP",
    }),
    dbClientes.criar({
      nome: "Anderson Ribeiro",
      telefone: "(11) 96500-1188",
      cidade: "Guarulhos",
      estado: "SP",
      endereco: "Rua Tapajós, 210",
    }),
  ]);

  /* --------------------------------------------------------- Link público */
  const link = await dbLinks.criar({
    token: token(12),
    titulo: "Solicitação de Orçamento — EC Montagens",
    mensagem:
      "Preencha os dados do seu móvel e retornamos com o orçamento em até 24 horas úteis.",
    criadoPorId: admin.id,
    acessos: 34,
    envios: 3,
    ativo: true,
  });

  /* ------------------------------------------------------------ Orçamentos */
  await dbOrcamentos.criar({
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
    itensJson: "[]",
  });

  await dbOrcamentos.criar({
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
    itensJson: "[]",
  });

  await dbOrcamentos.criar({
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
    itensJson: "[]",
  });

  /* -------------------------------------------------- Ordens de Serviço */
  const checklistPadrao = [
    "Conferência das peças e ferragens recebidas",
    "Montagem executada conforme o projeto",
    "Nivelamento e fixação na parede",
    "Portas, gavetas e corrediças ajustadas",
    "Limpeza do local e retirada das embalagens",
    "Cliente orientado sobre uso e conservação",
  ];

  const criarChecklist = (concluidos: number) =>
    checklistPadrao.map((descricao, i) => ({
      id: gerarId(),
      descricao,
      ordemIndex: i,
      concluido: i < concluidos,
    }));

  // 1) Concluída, assinada e paga.
  const os1 = await dbOrdens.criar({
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
    valorTotal: 3150,
    comissaoPercent: 35,
    comissaoValor: 1102.5,
    formaPagamento: "PIX",
    pago: true,
    tokenAssinatura: token(),
    avaliacaoNota: 5,
    avaliacaoComentario: "Serviço impecável, montagem perfeita e local entregue limpo.",
    checklist: criarChecklist(6),
    itens: [
      { id: gerarId(), descricao: "Montagem de módulos aéreos", quantidade: 8, valorUnitario: 180 },
      { id: gerarId(), descricao: "Montagem de balcões e gaveteiros", quantidade: 6, valorUnitario: 210 },
      { id: gerarId(), descricao: "Instalação de coifa e torre quente", quantidade: 1, valorUnitario: 450 },
    ],
    assinaturas: [
      {
        id: gerarId(),
        tipo: "MONTADOR",
        nome: "Everaldo Souza",
        documento: "184.552.339-04",
        imagem: assinaturaDemo("EveraldoMONTADOR"),
        hash: hash(`os1|MONTADOR|Everaldo Souza|${diasAtras(11)}`),
        ip: "189.45.112.7",
        userAgent: "Mozilla/5.0 (Android 14; Mobile) AppleWebKit/537.36 Chrome/126",
        assinadoEm: diasAtras(11),
      },
      {
        id: gerarId(),
        tipo: "CLIENTE",
        nome: "Marina Albuquerque",
        documento: "327.884.910-22",
        imagem: assinaturaDemo("MarinaCLIENTE"),
        hash: hash(`os1|CLIENTE|Marina Albuquerque|${diasAtras(11)}`),
        ip: "189.45.112.7",
        userAgent: "Mozilla/5.0 (Android 14; Mobile) AppleWebKit/537.36 Chrome/126",
        assinadoEm: diasAtras(11),
      },
    ],
  });

  // 2) Concluída e assinada, porém ainda não recebida (entra em "A receber").
  const os2 = await dbOrdens.criar({
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
    valorTotal: 2740,
    comissaoPercent: 30,
    comissaoValor: 822,
    formaPagamento: "BOLETO",
    pago: false,
    tokenAssinatura: token(),
    avaliacaoNota: 5,
    checklist: criarChecklist(6),
    itens: [
      { id: gerarId(), descricao: "Montagem de estação de trabalho", quantidade: 12, valorUnitario: 165 },
      { id: gerarId(), descricao: "Instalação de painel divisório", quantidade: 8, valorUnitario: 95 },
    ],
    assinaturas: [
      {
        id: gerarId(),
        tipo: "MONTADOR",
        nome: "Rafael Lima",
        documento: null,
        imagem: assinaturaDemo("RafaelMONTADOR"),
        hash: hash(`os2|MONTADOR|Rafael Lima|${diasAtras(3)}`),
        ip: "189.45.112.7",
        userAgent: "Mozilla/5.0",
        assinadoEm: diasAtras(3),
      },
      {
        id: gerarId(),
        tipo: "CLIENTE",
        nome: "Sandra Bertolini",
        documento: "18.442.907/0001-31",
        imagem: assinaturaDemo("SandraCLIENTE"),
        hash: hash(`os2|CLIENTE|Sandra Bertolini|${diasAtras(3)}`),
        ip: "189.45.112.7",
        userAgent: "Mozilla/5.0",
        assinadoEm: diasAtras(3),
      },
    ],
  });

  // 3) Em andamento
  const os3 = await dbOrdens.criar({
    numero: 3,
    titulo: "Guarda-roupa 6 portas + cômoda",
    descricao: "Montagem no dormitório principal, com espelho e fixação de puxadores.",
    clienteId: clientes[1].id,
    montadorId: everaldo.id,
    endereco: "Av. Industrial, 1120",
    cidade: "Santo André",
    status: "EM_ANDAMENTO",
    dataAgendada: new Date().toISOString(),
    dataInicio: new Date().toISOString(),
    valorTotal: 810,
    comissaoPercent: 35,
    comissaoValor: 283.5,
    formaPagamento: "PIX",
    pago: false,
    tokenAssinatura: token(),
    checklist: criarChecklist(3),
    itens: [
      { id: gerarId(), descricao: "Montagem de guarda-roupa 6 portas", quantidade: 1, valorUnitario: 620 },
      { id: gerarId(), descricao: "Montagem de cômoda 5 gavetas", quantidade: 1, valorUnitario: 190 },
    ],
  });

  // 4) Agendada
  const os4 = await dbOrdens.criar({
    numero: 4,
    titulo: "Home theater e painel de TV",
    descricao: "Painel ripado 2,80 m com nicho e rack suspenso.",
    clienteId: clientes[3].id,
    montadorId: rafael.id,
    endereco: "Alameda Rio Negro, 500",
    cidade: "Barueri",
    status: "AGENDADA",
    dataAgendada: diasAFrente(3),
    valorTotal: 1020,
    comissaoPercent: 30,
    comissaoValor: 306,
    formaPagamento: "CARTAO",
    pago: false,
    tokenAssinatura: token(),
    checklist: criarChecklist(0),
    itens: [
      { id: gerarId(), descricao: "Instalação de painel ripado", quantidade: 1, valorUnitario: 780 },
      { id: gerarId(), descricao: "Montagem de rack suspenso", quantidade: 1, valorUnitario: 240 },
    ],
  });

  // 5) Aguardando assinatura do cliente
  const os5 = await dbOrdens.criar({
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
    valorTotal: 380,
    comissaoPercent: 35,
    comissaoValor: 133,
    formaPagamento: "DINHEIRO",
    pago: false,
    tokenAssinatura: token(),
    checklist: criarChecklist(6),
    itens: [{ id: gerarId(), descricao: "Reparo e regulagem de armário", quantidade: 1, valorUnitario: 380 }],
    assinaturas: [
      {
        id: gerarId(),
        tipo: "MONTADOR",
        nome: "Everaldo Souza",
        documento: "184.552.339-04",
        imagem: assinaturaDemo("EveraldoReparo"),
        hash: hash(`os5|MONTADOR|Everaldo Souza|${diasAtras(1)}`),
        ip: "189.45.112.7",
        userAgent: "Mozilla/5.0",
        assinadoEm: diasAtras(1),
      },
    ],
  });

  // 6) Concluída, assinada e paga
  const os6 = await dbOrdens.criar({
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
    valorTotal: 2325,
    comissaoPercent: 30,
    comissaoValor: 697.5,
    formaPagamento: "PIX",
    pago: true,
    tokenAssinatura: token(),
    avaliacaoNota: 5,
    avaliacaoComentario: "Pontualidade e capricho do começo ao fim. Recomendo!",
    checklist: criarChecklist(6),
    itens: [
      { id: gerarId(), descricao: "Montagem de guarda-roupa 8 portas", quantidade: 1, valorUnitario: 1180 },
      { id: gerarId(), descricao: "Montagem de cama box com cabeceira", quantidade: 1, valorUnitario: 420 },
      { id: gerarId(), descricao: "Montagem de criado-mudo", quantidade: 2, valorUnitario: 145 },
      { id: gerarId(), descricao: "Montagem de cômoda 6 gavetas", quantidade: 1, valorUnitario: 260 },
      { id: gerarId(), descricao: "Fixação e nivelamento em parede de alvenaria", quantidade: 1, valorUnitario: 320 },
    ],
    assinaturas: [
      {
        id: gerarId(),
        tipo: "MONTADOR",
        nome: "Rafael Lima",
        documento: null,
        imagem: assinaturaDemo("RafaelDormitorio"),
        hash: hash(`os6|MONTADOR|Rafael Lima|${diasAtras(7)}`),
        ip: "189.45.112.7",
        userAgent: "Mozilla/5.0",
        assinadoEm: diasAtras(7),
      },
      {
        id: gerarId(),
        tipo: "CLIENTE",
        nome: "Juliana Ferraz",
        documento: null,
        imagem: assinaturaDemo("JulianaDormitorio"),
        hash: hash(`os6|CLIENTE|Juliana Ferraz|${diasAtras(7)}`),
        ip: "189.45.112.7",
        userAgent: "Mozilla/5.0",
        assinadoEm: diasAtras(7),
      },
    ],
  });

  /* ------------------------------------------------------------ Financeiro */
  await dbLancamentos.criar({
    tipo: "RECEITA",
    categoria: "SERVICO",
    descricao: "Montagem de cozinha planejada — OS-0001 · Marina Albuquerque",
    valor: 3150,
    data: diasAtras(11),
    status: "CONFIRMADO",
    formaPagamento: "PIX",
    automatico: true,
    ordemId: os1.id,
  });

  await dbLancamentos.criar({
    tipo: "DESPESA",
    categoria: "COMISSAO",
    descricao: "Comissão Everaldo Souza (35%) — OS-0001",
    valor: 1102.5,
    data: diasAtras(11),
    status: "CONFIRMADO",
    formaPagamento: "PIX",
    automatico: true,
    ordemId: os1.id,
    montadorId: everaldo.id,
  });

  await dbLancamentos.criar({
    tipo: "RECEITA",
    categoria: "SERVICO",
    descricao: "Montagem de 12 estações — OS-0002 · Móveis Bertolini",
    valor: 2740,
    data: diasAtras(3),
    status: "PENDENTE",
    formaPagamento: "BOLETO",
    automatico: true,
    ordemId: os2.id,
  });

  await dbLancamentos.criar({
    tipo: "DESPESA",
    categoria: "COMISSAO",
    descricao: "Comissão Rafael Lima (30%) — OS-0002",
    valor: 822,
    data: diasAtras(3),
    status: "CONFIRMADO",
    formaPagamento: "PIX",
    automatico: true,
    ordemId: os2.id,
    montadorId: rafael.id,
  });

  await dbLancamentos.criar({
    tipo: "RECEITA",
    categoria: "SERVICO",
    descricao: "Dormitório completo — OS-0006 · Juliana Ferraz",
    valor: 2325,
    data: diasAtras(7),
    status: "CONFIRMADO",
    formaPagamento: "PIX",
    automatico: true,
    ordemId: os6.id,
  });

  await dbLancamentos.criar({
    tipo: "DESPESA",
    categoria: "COMISSAO",
    descricao: "Comissão Rafael Lima (30%) — OS-0006",
    valor: 697.5,
    data: diasAtras(7),
    status: "CONFIRMADO",
    formaPagamento: "PIX",
    automatico: true,
    ordemId: os6.id,
    montadorId: rafael.id,
  });

  await dbLancamentos.criar({
    tipo: "DESPESA",
    categoria: "TRANSPORTE",
    descricao: "Combustível e pedágio — atendimentos da semana",
    valor: 418.9,
    data: diasAtras(6),
    status: "CONFIRMADO",
    formaPagamento: "CARTAO",
    automatico: false,
  });

  await dbLancamentos.criar({
    tipo: "DESPESA",
    categoria: "FERRAMENTA",
    descricao: "Parafusadeira de impacto 20V + jogo de brocas",
    valor: 899,
    data: diasAtras(9),
    status: "CONFIRMADO",
    formaPagamento: "CARTAO",
    automatico: false,
  });

  await dbLancamentos.criar({
    tipo: "DESPESA",
    categoria: "MATERIAL",
    descricao: "Buchas, parafusos, cantoneiras e fita dupla-face",
    valor: 246.5,
    data: diasAtras(8),
    status: "CONFIRMADO",
    formaPagamento: "DINHEIRO",
    automatico: false,
  });

  await dbLancamentos.criar({
    tipo: "DESPESA",
    categoria: "ADMINISTRATIVO",
    descricao: "Plano de celular e internet móvel da equipe",
    valor: 189.9,
    data: diasAtras(15),
    status: "CONFIRMADO",
    formaPagamento: "BOLETO",
    automatico: false,
  });

  await dbLancamentos.criar({
    tipo: "RECEITA",
    categoria: "OUTRO",
    descricao: "Venda de acessórios e ferragens ao cliente",
    valor: 320,
    data: diasAtras(7),
    status: "CONFIRMADO",
    formaPagamento: "PIX",
    automatico: false,
  });

  /* ---------------------------------------------------------- Notificações */
  await dbNotificacoes.criar({
    tipo: "ORCAMENTO",
    titulo: "Novo orçamento de Patrícia Nogueira",
    mensagem: "Móveis planejados · 15 item(ns) · (11) 99450-2211",
    link: "/orcamentos",
    lida: false,
  });

  await dbNotificacoes.criar({
    tipo: "ORCAMENTO",
    titulo: "Novo orçamento de Thiago Menezes",
    mensagem: "Montagem de móveis · 2 item(ns) · (11) 98330-1177",
    link: "/orcamentos",
    lida: false,
  });

  await dbNotificacoes.criar({
    tipo: "ASSINATURA",
    titulo: "Assinatura registrada · OS-0005",
    mensagem: "O montador Everaldo Souza assinou. Aguardando a assinatura do cliente.",
    link: `/ordens/${os5.id}`,
    lida: false,
  });

  await dbNotificacoes.criar({
    tipo: "OS_CONCLUIDA",
    titulo: "OS-0002 concluída e assinada",
    mensagem: "Móveis Bertolini — montador e cliente assinaram digitalmente.",
    link: `/ordens/${os2.id}`,
    lida: true,
  });

  await dbConfig.definir("empresa", "EC Montagens de Móveis");

  return { admin, senha: senhaPadrao };
}
