import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";
import { firestore } from "./firebase";
import { Papel, StatusOS, StatusOrcamento } from "./constants";

/* ---------------------------------------------------------------------------
 * Tipos dos Documentos no Firestore
 * ------------------------------------------------------------------------- */
export interface UsuarioDoc {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  papel: Papel;
  telefone?: string | null;
  documento?: string | null;
  comissaoPadrao: number;
  ativo: boolean;
  corAvatar: string;
  ultimoAcesso?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ClienteDoc {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  documento?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  observacoes?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ItemOrdemDoc {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface ChecklistItemDoc {
  id: string;
  descricao: string;
  concluido: boolean;
  ordemIndex: number;
}

export interface FotoOrdemDoc {
  id: string;
  dataUrl: string;
  legenda?: string | null;
  etapa: "ANTES" | "DEPOIS";
  criadoEm: string;
}

export interface AssinaturaDoc {
  id: string;
  tipo: "MONTADOR" | "CLIENTE";
  nome: string;
  documento?: string | null;
  imagem: string;
  hash: string;
  ip?: string | null;
  userAgent?: string | null;
  assinadoEm: string;
}

export interface OrdemServicoDoc {
  id: string;
  numero: number;
  titulo: string;
  descricao?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  status: StatusOS;
  dataAgendada?: string | null;
  dataInicio?: string | null;
  dataConclusao?: string | null;
  valorTotal: number;
  comissaoPercent: number;
  comissaoValor: number;
  formaPagamento: string;
  pago: boolean;
  observacoes?: string | null;
  tokenAssinatura: string;
  avaliacaoNota?: number | null;
  avaliacaoComentario?: string | null;
  clienteId: string;
  montadorId?: string | null;
  orcamentoId?: string | null;
  itens: ItemOrdemDoc[];
  checklist: ChecklistItemDoc[];
  fotos: FotoOrdemDoc[];
  assinaturas: AssinaturaDoc[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface OrcamentoDoc {
  id: string;
  numero: number;
  nomeContato: string;
  telefone: string;
  email?: string | null;
  documento?: string | null;
  cep?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  tipoServico: string;
  descricao: string;
  quantidadeItens: number;
  prazoDesejado?: string | null;
  itensJson: string;
  valorProposto?: number | null;
  status: StatusOrcamento;
  observacoesInternas?: string | null;
  respondidoEm?: string | null;
  clienteId?: string | null;
  linkId?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface LinkPublicoDoc {
  id: string;
  token: string;
  titulo: string;
  mensagem?: string | null;
  ativo: boolean;
  expiraEm?: string | null;
  acessos: number;
  envios: number;
  criadoPorId?: string | null;
  criadoEm: string;
}

export interface LancamentoDoc {
  id: string;
  tipo: "RECEITA" | "DESPESA";
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  status: "PENDENTE" | "CONFIRMADO" | "CANCELADO";
  formaPagamento: string;
  observacoes?: string | null;
  automatico: boolean;
  ordemId?: string | null;
  montadorId?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface NotificacaoDoc {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string | null;
  lida: boolean;
  criadoEm: string;
}

export interface ConfigDoc {
  chave: string;
  valor: string;
}

/* ---------------------------------------------------------------------------
 * Nomes das Coleções
 * ------------------------------------------------------------------------- */
export const COLECOES = {
  USUARIOS: "usuarios",
  CLIENTES: "clientes",
  ORDENS: "ordensServico",
  ORCAMENTOS: "orcamentos",
  LINKS: "linksPublicos",
  LANCAMENTOS: "lancamentos",
  NOTIFICACOES: "notificacoes",
  CONFIG: "config",
} as const;

export function gerarId(): string {
  return doc(collection(firestore, "_tmp")).id;
}

/* ---------------------------------------------------------------------------
 * Repositórios / Helpers de Acesso aos Dados
 * ------------------------------------------------------------------------- */

// --- USUÁRIOS ---
export const dbUsuarios = {
  async buscarPorId(id: string): Promise<UsuarioDoc | null> {
    const snap = await getDoc(doc(firestore, COLECOES.USUARIOS, id));
    return snap.exists() ? (snap.data() as UsuarioDoc) : null;
  },

  async buscarPorEmail(email: string): Promise<UsuarioDoc | null> {
    const q = query(
      collection(firestore, COLECOES.USUARIOS),
      where("email", "==", email.trim().toLowerCase())
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as UsuarioDoc;
  },

  async listar(filtro?: { papel?: Papel; ativo?: boolean }): Promise<UsuarioDoc[]> {
    const constraints: QueryConstraint[] = [];
    if (filtro?.papel) constraints.push(where("papel", "==", filtro.papel));
    if (filtro?.ativo !== undefined) constraints.push(where("ativo", "==", filtro.ativo));

    const snap = await getDocs(query(collection(firestore, COLECOES.USUARIOS), ...constraints));
    const lista = snap.docs.map((d) => d.data() as UsuarioDoc);
    return lista.sort((a, b) => a.nome.localeCompare(b.nome));
  },

  async criar(dados: Omit<UsuarioDoc, "id" | "criadoEm" | "atualizadoEm"> & { id?: string }): Promise<UsuarioDoc> {
    const id = dados.id || gerarId();
    const agora = new Date().toISOString();
    const docData: UsuarioDoc = {
      ...dados,
      id,
      email: dados.email.trim().toLowerCase(),
      criadoEm: agora,
      atualizadoEm: agora,
    };
    await setDoc(doc(firestore, COLECOES.USUARIOS, id), docData);
    return docData;
  },

  async atualizar(id: string, dados: Partial<UsuarioDoc>): Promise<UsuarioDoc | null> {
    const ref = doc(firestore, COLECOES.USUARIOS, id);
    const agora = new Date().toISOString();
    await updateDoc(ref, { ...dados, atualizadoEm: agora });
    return this.buscarPorId(id);
  },

  async excluir(id: string): Promise<void> {
    await deleteDoc(doc(firestore, COLECOES.USUARIOS, id));
  },
};

// --- CLIENTES ---
export const dbClientes = {
  async buscarPorId(id: string): Promise<ClienteDoc | null> {
    const snap = await getDoc(doc(firestore, COLECOES.CLIENTES, id));
    return snap.exists() ? (snap.data() as ClienteDoc) : null;
  },

  async listar(busca?: string): Promise<ClienteDoc[]> {
    const snap = await getDocs(collection(firestore, COLECOES.CLIENTES));
    let lista = snap.docs.map((d) => d.data() as ClienteDoc);
    if (busca?.trim()) {
      const b = busca.toLowerCase();
      lista = lista.filter(
        (c) =>
          c.nome.toLowerCase().includes(b) ||
          c.telefone?.toLowerCase().includes(b) ||
          c.email?.toLowerCase().includes(b) ||
          c.cidade?.toLowerCase().includes(b)
      );
    }
    return lista.sort((a, b) => a.nome.localeCompare(b.nome));
  },

  async criar(dados: Omit<ClienteDoc, "id" | "criadoEm" | "atualizadoEm"> & { id?: string }): Promise<ClienteDoc> {
    const id = dados.id || gerarId();
    const agora = new Date().toISOString();
    const docData: ClienteDoc = {
      ...dados,
      id,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    await setDoc(doc(firestore, COLECOES.CLIENTES, id), docData);
    return docData;
  },

  async atualizar(id: string, dados: Partial<ClienteDoc>): Promise<ClienteDoc | null> {
    const ref = doc(firestore, COLECOES.CLIENTES, id);
    const agora = new Date().toISOString();
    await updateDoc(ref, { ...dados, atualizadoEm: agora });
    return this.buscarPorId(id);
  },

  async excluir(id: string): Promise<void> {
    await deleteDoc(doc(firestore, COLECOES.CLIENTES, id));
  },
};

// --- ORDENS DE SERVIÇO ---
export const dbOrdens = {
  async buscarPorId(id: string): Promise<OrdemServicoDoc | null> {
    const snap = await getDoc(doc(firestore, COLECOES.ORDENS, id));
    return snap.exists() ? (snap.data() as OrdemServicoDoc) : null;
  },

  async buscarPorTokenAssinatura(token: string): Promise<OrdemServicoDoc | null> {
    const q = query(
      collection(firestore, COLECOES.ORDENS),
      where("tokenAssinatura", "==", token)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as OrdemServicoDoc;
  },

  async proximoNumero(): Promise<number> {
    const snap = await getDocs(collection(firestore, COLECOES.ORDENS));
    if (snap.empty) return 1;
    const numeros = snap.docs.map((d) => (d.data() as OrdemServicoDoc).numero || 0);
    return Math.max(...numeros, 0) + 1;
  },

  async listar(filtro?: {
    status?: StatusOS;
    montadorId?: string;
    clienteId?: string;
  }): Promise<OrdemServicoDoc[]> {
    const snap = await getDocs(collection(firestore, COLECOES.ORDENS));
    let lista = snap.docs.map((d) => d.data() as OrdemServicoDoc);

    if (filtro?.status) lista = lista.filter((o) => o.status === filtro.status);
    if (filtro?.montadorId) lista = lista.filter((o) => o.montadorId === filtro.montadorId);
    if (filtro?.clienteId) lista = lista.filter((o) => o.clienteId === filtro.clienteId);

    return lista.sort((a, b) => (b.numero || 0) - (a.numero || 0));
  },

  async criar(
    dados: Omit<OrdemServicoDoc, "id" | "criadoEm" | "atualizadoEm" | "itens" | "checklist" | "fotos" | "assinaturas"> & {
      id?: string;
      itens?: ItemOrdemDoc[];
      checklist?: ChecklistItemDoc[];
      fotos?: FotoOrdemDoc[];
      assinaturas?: AssinaturaDoc[];
    }
  ): Promise<OrdemServicoDoc> {
    const id = dados.id || gerarId();
    const agora = new Date().toISOString();
    const docData: OrdemServicoDoc = {
      ...dados,
      id,
      itens: dados.itens || [],
      checklist: dados.checklist || [],
      fotos: dados.fotos || [],
      assinaturas: dados.assinaturas || [],
      criadoEm: agora,
      atualizadoEm: agora,
    };
    await setDoc(doc(firestore, COLECOES.ORDENS, id), docData);
    return docData;
  },

  async atualizar(id: string, dados: Partial<OrdemServicoDoc>): Promise<OrdemServicoDoc | null> {
    const ref = doc(firestore, COLECOES.ORDENS, id);
    const agora = new Date().toISOString();
    await updateDoc(ref, { ...dados, atualizadoEm: agora });
    return this.buscarPorId(id);
  },

  async excluir(id: string): Promise<void> {
    await deleteDoc(doc(firestore, COLECOES.ORDENS, id));
  },
};

// --- ORÇAMENTOS ---
export const dbOrcamentos = {
  async buscarPorId(id: string): Promise<OrcamentoDoc | null> {
    const snap = await getDoc(doc(firestore, COLECOES.ORCAMENTOS, id));
    return snap.exists() ? (snap.data() as OrcamentoDoc) : null;
  },

  async proximoNumero(): Promise<number> {
    const snap = await getDocs(collection(firestore, COLECOES.ORCAMENTOS));
    if (snap.empty) return 1;
    const numeros = snap.docs.map((d) => (d.data() as OrcamentoDoc).numero || 0);
    return Math.max(...numeros, 0) + 1;
  },

  async listar(filtro?: { status?: StatusOrcamento }): Promise<OrcamentoDoc[]> {
    const snap = await getDocs(collection(firestore, COLECOES.ORCAMENTOS));
    let lista = snap.docs.map((d) => d.data() as OrcamentoDoc);
    if (filtro?.status) lista = lista.filter((o) => o.status === filtro.status);
    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  },

  async criar(dados: Omit<OrcamentoDoc, "id" | "criadoEm" | "atualizadoEm"> & { id?: string }): Promise<OrcamentoDoc> {
    const id = dados.id || gerarId();
    const agora = new Date().toISOString();
    const docData: OrcamentoDoc = {
      ...dados,
      id,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    await setDoc(doc(firestore, COLECOES.ORCAMENTOS, id), docData);
    return docData;
  },

  async atualizar(id: string, dados: Partial<OrcamentoDoc>): Promise<OrcamentoDoc | null> {
    const ref = doc(firestore, COLECOES.ORCAMENTOS, id);
    const agora = new Date().toISOString();
    await updateDoc(ref, { ...dados, atualizadoEm: agora });
    return this.buscarPorId(id);
  },

  async excluir(id: string): Promise<void> {
    await deleteDoc(doc(firestore, COLECOES.ORCAMENTOS, id));
  },
};

// --- LINKS PÚBLICOS ---
export const dbLinks = {
  async buscarPorToken(token: string): Promise<LinkPublicoDoc | null> {
    const q = query(
      collection(firestore, COLECOES.LINKS),
      where("token", "==", token)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as LinkPublicoDoc;
  },

  async buscarPorId(id: string): Promise<LinkPublicoDoc | null> {
    const snap = await getDoc(doc(firestore, COLECOES.LINKS, id));
    return snap.exists() ? (snap.data() as LinkPublicoDoc) : null;
  },

  async listar(): Promise<LinkPublicoDoc[]> {
    const snap = await getDocs(collection(firestore, COLECOES.LINKS));
    const lista = snap.docs.map((d) => d.data() as LinkPublicoDoc);
    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  },

  async criar(dados: Omit<LinkPublicoDoc, "id" | "criadoEm"> & { id?: string }): Promise<LinkPublicoDoc> {
    const id = dados.id || gerarId();
    const agora = new Date().toISOString();
    const docData: LinkPublicoDoc = {
      ...dados,
      id,
      criadoEm: agora,
    };
    await setDoc(doc(firestore, COLECOES.LINKS, id), docData);
    return docData;
  },

  async atualizar(id: string, dados: Partial<LinkPublicoDoc>): Promise<LinkPublicoDoc | null> {
    const ref = doc(firestore, COLECOES.LINKS, id);
    await updateDoc(ref, dados);
    return this.buscarPorId(id);
  },

  async incrementarAcessos(id: string): Promise<void> {
    const docLink = await this.buscarPorId(id);
    if (docLink) {
      await this.atualizar(id, { acessos: (docLink.acessos || 0) + 1 });
    }
  },

  async incrementarEnvios(id: string): Promise<void> {
    const docLink = await this.buscarPorId(id);
    if (docLink) {
      await this.atualizar(id, { envios: (docLink.envios || 0) + 1 });
    }
  },

  async excluir(id: string): Promise<void> {
    await deleteDoc(doc(firestore, COLECOES.LINKS, id));
  },
};

// --- LANÇAMENTOS FINANCEIROS ---
export const dbLancamentos = {
  async buscarPorId(id: string): Promise<LancamentoDoc | null> {
    const snap = await getDoc(doc(firestore, COLECOES.LANCAMENTOS, id));
    return snap.exists() ? (snap.data() as LancamentoDoc) : null;
  },

  async listar(filtro?: {
    tipo?: "RECEITA" | "DESPESA";
    status?: "PENDENTE" | "CONFIRMADO" | "CANCELADO";
    ordemId?: string;
    montadorId?: string;
  }): Promise<LancamentoDoc[]> {
    const snap = await getDocs(collection(firestore, COLECOES.LANCAMENTOS));
    let lista = snap.docs.map((d) => d.data() as LancamentoDoc);

    if (filtro?.tipo) lista = lista.filter((l) => l.tipo === filtro.tipo);
    if (filtro?.status) lista = lista.filter((l) => l.status === filtro.status);
    if (filtro?.ordemId) lista = lista.filter((l) => l.ordemId === filtro.ordemId);
    if (filtro?.montadorId) lista = lista.filter((l) => l.montadorId === filtro.montadorId);

    return lista.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  },

  async criar(dados: Omit<LancamentoDoc, "id" | "criadoEm" | "atualizadoEm"> & { id?: string }): Promise<LancamentoDoc> {
    const id = dados.id || gerarId();
    const agora = new Date().toISOString();
    const docData: LancamentoDoc = {
      ...dados,
      id,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    await setDoc(doc(firestore, COLECOES.LANCAMENTOS, id), docData);
    return docData;
  },

  async atualizar(id: string, dados: Partial<LancamentoDoc>): Promise<LancamentoDoc | null> {
    const ref = doc(firestore, COLECOES.LANCAMENTOS, id);
    const agora = new Date().toISOString();
    await updateDoc(ref, { ...dados, atualizadoEm: agora });
    return this.buscarPorId(id);
  },

  async excluir(id: string): Promise<void> {
    await deleteDoc(doc(firestore, COLECOES.LANCAMENTOS, id));
  },

  async excluirAutomaticosDaOrdem(ordemId: string): Promise<void> {
    const q = query(
      collection(firestore, COLECOES.LANCAMENTOS),
      where("ordemId", "==", ordemId),
      where("automatico", "==", true)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(firestore);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  },
};

// --- NOTIFICAÇÕES ---
export const dbNotificacoes = {
  async listar(limite = 10): Promise<NotificacaoDoc[]> {
    const snap = await getDocs(collection(firestore, COLECOES.NOTIFICACOES));
    const lista = snap.docs.map((d) => d.data() as NotificacaoDoc);
    return lista
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
      .slice(0, limite);
  },

  async contarNaoLidas(): Promise<number> {
    const q = query(
      collection(firestore, COLECOES.NOTIFICACOES),
      where("lida", "==", false)
    );
    const snap = await getDocs(q);
    return snap.size;
  },

  async criar(dados: Omit<NotificacaoDoc, "id" | "criadoEm"> & { id?: string }): Promise<NotificacaoDoc> {
    const id = dados.id || gerarId();
    const agora = new Date().toISOString();
    const docData: NotificacaoDoc = {
      ...dados,
      id,
      criadoEm: agora,
    };
    await setDoc(doc(firestore, COLECOES.NOTIFICACOES, id), docData);
    return docData;
  },

  async marcarComoLida(id: string): Promise<void> {
    await updateDoc(doc(firestore, COLECOES.NOTIFICACOES, id), { lida: true });
  },

  async marcarTodasComoLidas(): Promise<void> {
    const snap = await getDocs(collection(firestore, COLECOES.NOTIFICACOES));
    const batch = writeBatch(firestore);
    snap.docs.forEach((d) => {
      if (!d.data().lida) {
        batch.update(d.ref, { lida: true });
      }
    });
    await batch.commit();
  },
};

// --- CONFIGURAÇÕES ---
export const dbConfig = {
  async obter(chave: string): Promise<string | null> {
    const snap = await getDoc(doc(firestore, COLECOES.CONFIG, chave));
    return snap.exists() ? (snap.data() as ConfigDoc).valor : null;
  },

  async definir(chave: string, valor: string): Promise<void> {
    await setDoc(doc(firestore, COLECOES.CONFIG, chave), { chave, valor });
  },
};
