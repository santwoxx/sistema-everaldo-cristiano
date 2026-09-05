-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'MONTADOR',
    "telefone" TEXT,
    "documento" TEXT,
    "comissaoPadrao" REAL NOT NULL DEFAULT 30,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "corAvatar" TEXT NOT NULL DEFAULT '#16a34a',
    "ultimoAcesso" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "documento" TEXT,
    "cep" TEXT,
    "endereco" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LinkPublico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "titulo" TEXT NOT NULL DEFAULT 'Solicitacao de Orcamento',
    "mensagem" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "expiraEm" DATETIME,
    "acessos" INTEGER NOT NULL DEFAULT 0,
    "envios" INTEGER NOT NULL DEFAULT 0,
    "criadoPorId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LinkPublico_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Orcamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "nomeContato" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "documento" TEXT,
    "cep" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "tipoServico" TEXT NOT NULL DEFAULT 'MONTAGEM',
    "descricao" TEXT NOT NULL,
    "quantidadeItens" INTEGER NOT NULL DEFAULT 1,
    "prazoDesejado" DATETIME,
    "itensJson" TEXT NOT NULL DEFAULT '[]',
    "valorProposto" REAL,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "observacoesInternas" TEXT,
    "respondidoEm" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    "clienteId" TEXT,
    "linkId" TEXT,
    CONSTRAINT "Orcamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Orcamento_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "LinkPublico" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrdemServico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "dataAgendada" DATETIME,
    "dataInicio" DATETIME,
    "dataConclusao" DATETIME,
    "valorTotal" REAL NOT NULL DEFAULT 0,
    "comissaoPercent" REAL NOT NULL DEFAULT 30,
    "comissaoValor" REAL NOT NULL DEFAULT 0,
    "formaPagamento" TEXT NOT NULL DEFAULT 'PIX',
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "tokenAssinatura" TEXT NOT NULL,
    "avaliacaoNota" INTEGER,
    "avaliacaoComentario" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    "clienteId" TEXT NOT NULL,
    "montadorId" TEXT,
    "orcamentoId" TEXT,
    CONSTRAINT "OrdemServico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrdemServico_montadorId_fkey" FOREIGN KEY ("montadorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OrdemServico_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemOrdem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "quantidade" REAL NOT NULL DEFAULT 1,
    "valorUnitario" REAL NOT NULL DEFAULT 0,
    "ordemId" TEXT NOT NULL,
    CONSTRAINT "ItemOrdem_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdemServico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "ordemIndex" INTEGER NOT NULL DEFAULT 0,
    "ordemId" TEXT NOT NULL,
    CONSTRAINT "ChecklistItem_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdemServico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FotoOrdem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataUrl" TEXT NOT NULL,
    "legenda" TEXT,
    "etapa" TEXT NOT NULL DEFAULT 'DEPOIS',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordemId" TEXT NOT NULL,
    CONSTRAINT "FotoOrdem_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdemServico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "imagem" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "assinadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordemId" TEXT NOT NULL,
    CONSTRAINT "Assinatura_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdemServico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lancamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'SERVICO',
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMADO',
    "formaPagamento" TEXT NOT NULL DEFAULT 'PIX',
    "observacoes" TEXT,
    "automatico" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    "ordemId" TEXT,
    "montadorId" TEXT,
    CONSTRAINT "Lancamento_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdemServico" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lancamento_montadorId_fkey" FOREIGN KEY ("montadorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "link" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Config" (
    "chave" TEXT NOT NULL PRIMARY KEY,
    "valor" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_papel_idx" ON "Usuario"("papel");

-- CreateIndex
CREATE INDEX "Cliente_nome_idx" ON "Cliente"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "LinkPublico_token_key" ON "LinkPublico"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Orcamento_numero_key" ON "Orcamento"("numero");

-- CreateIndex
CREATE INDEX "Orcamento_status_idx" ON "Orcamento"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_numero_key" ON "OrdemServico"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_tokenAssinatura_key" ON "OrdemServico"("tokenAssinatura");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_orcamentoId_key" ON "OrdemServico"("orcamentoId");

-- CreateIndex
CREATE INDEX "OrdemServico_status_idx" ON "OrdemServico"("status");

-- CreateIndex
CREATE INDEX "OrdemServico_montadorId_idx" ON "OrdemServico"("montadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_ordemId_tipo_key" ON "Assinatura"("ordemId", "tipo");

-- CreateIndex
CREATE INDEX "Lancamento_tipo_status_idx" ON "Lancamento"("tipo", "status");

-- CreateIndex
CREATE INDEX "Lancamento_data_idx" ON "Lancamento"("data");

-- CreateIndex
CREATE INDEX "Notificacao_lida_idx" ON "Notificacao"("lida");
