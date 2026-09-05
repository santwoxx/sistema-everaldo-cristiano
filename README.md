<div align="center">

<img src="public/logo.svg" width="110" alt="EC Montagens de Móveis" />

# EC Montagens de Móveis — Sistema de Gestão

**Gestão financeira · Ordens de serviço com assinatura digital · Orçamentos online · Equipe**

Qualidade • Detalhes • Confiança

</div>

---

## O que o sistema faz

Um sistema completo para uma empresa de montagem de móveis, do primeiro contato do
cliente até o dinheiro entrando no caixa.

| Módulo | O que resolve |
| --- | --- |
| **Painel Financeiro** | Fluxo de caixa consolidado: faturamento confirmado, valores a receber, despesas operacionais, comissões dos montadores e lucro líquido, com extrato completo e evolução mensal. |
| **Ordens de Serviço** | Agendamento, itens e valores, checklist de qualidade, registro fotográfico e o termo de conclusão assinado digitalmente pelas duas partes. |
| **Assinatura Digital** | Montador e cliente assinam na tela (dedo, caneta ou mouse). Cada assinatura guarda data/hora, IP, navegador e um hash SHA-256 de integridade. |
| **Orçamentos Recebidos** | O administrador gera um link, envia pelo WhatsApp, o cliente preenche pelo celular e a solicitação cai no painel — com um clique vira ordem de serviço. |
| **Clientes** | Cadastro com endereço, histórico de serviços e total faturado por cliente. |
| **Equipe & Logins** | Cada montador tem login próprio, comissão padrão e acompanhamento de produção. |
| **App do Montador** | Versão de campo otimizada para celular: agenda do dia, checklist, fotos e coleta das assinaturas. |

### O fluxo completo

```
Cliente preenche o link  →  Orçamento cai no painel  →  Vira Ordem de Serviço
                                                                  ↓
Receita + comissão no financeiro  ←  OS concluída  ←  Montador e cliente assinam
```

A ordem de serviço **só é concluída quando as duas assinaturas existem**. Nesse
momento o sistema lança sozinho a receita e a comissão do montador no caixa —
receita `CONFIRMADO` se a OS estiver paga, ou `PENDENTE` (a receber) se não.

---

## Tecnologia

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Prisma ORM** — SQLite por padrão, PostgreSQL em um passo
- **Tailwind CSS v4** — layout responsivo, do celular ao desktop
- **Autenticação própria** — JWT assinado (`jose`) em cookie `httpOnly` + `bcrypt`
- **Server Actions** — sem camada de API para manter, validação com `zod`
- Zero dependências de serviços externos pagos

---

## Rodando localmente

Pré-requisito: **Node.js 20 ou superior**.

```bash
git clone https://github.com/santwoxx/sistema-everaldo-cristiano.git
cd sistema-everaldo-cristiano

npm install
cp .env.example .env      # no Windows: copy .env.example .env

npm run setup             # cria o banco e carrega os dados de demonstração
npm run dev
```

Abra **http://localhost:3000**.

### Acessos de demonstração

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@ecmontagens.com.br` | `ecmontagens2024` |
| Montador | `montador@ecmontagens.com.br` | `ecmontagens2024` |

> Ao entrar como montador o sistema abre direto o app de campo.
> O administrador pode visitar o app pelo menu **Painel do Montador**.

---

## Preparando para uso real

1. **Troque a chave de segurança.** Gere uma nova e coloque em `AUTH_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
2. **Troque a senha do administrador** em *Equipe & Logins*.
3. **Limpe os dados de exemplo:** no menu lateral, *Restaurar Demonstração* →
   **Começar do zero (uso real)**. Isso apaga tudo e mantém só o seu acesso.
4. **Cadastre a equipe** em *Equipe & Logins* — cada montador com login próprio.
5. **Defina a URL pública** em `NEXT_PUBLIC_APP_URL`, para que os links enviados
   ao cliente apontem para o endereço certo.
6. **Substitua o logotipo** trocando o arquivo `public/logo.svg` pela arte oficial.

---

## Deploy

### Vercel + PostgreSQL (recomendado)

1. Em `prisma/schema.prisma`, troque o provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   *O schema já foi escrito sem recursos exclusivos de um banco — nada mais muda.*

2. Importe o repositório na Vercel e crie um banco Postgres
   (a integração nativa com **Neon** faz isso em um clique e já preenche a
   `DATABASE_URL`).

3. Configure as variáveis de ambiente do projeto:

   | Variável | Valor |
   | --- | --- |
   | `DATABASE_URL` | string de conexão do Postgres |
   | `AUTH_SECRET` | chave aleatória gerada no passo anterior |
   | `NEXT_PUBLIC_APP_URL` | `https://seu-projeto.vercel.app` |
   | `ADMIN_EMAIL` / `ADMIN_SENHA` | credenciais do primeiro administrador |

4. Faça o deploy. O `npm run build` já roda `prisma migrate deploy`, criando as
   tabelas. Depois, crie o administrador uma única vez:
   ```bash
   npx prisma db seed --  # ou: npm run seed
   ```

### Servidor próprio / VPS / Railway / Render (SQLite)

Funciona sem banco externo — os dados ficam em um arquivo, que precisa estar em
um **disco persistente**:

```bash
npm ci
npm run build
npm run seed        # apenas na primeira vez
npm run start
```

Aponte um proxy reverso (Nginx, Caddy) com HTTPS para a porta `3000`.
Faça backup do arquivo `prisma/dev.db` — é ele que guarda tudo.

---

## Comandos

| Comando | Para quê |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (gera o client, aplica migrations) |
| `npm run start` | Servidor de produção |
| `npm run setup` | Cria o banco e carrega a demonstração |
| `npm run seed` | Só a carga de dados |
| `npx tsx prisma/seed.ts --force` | Apaga tudo e recria a demonstração |
| `npx tsx prisma/seed.ts --force --limpo` | Apaga tudo e cria só o administrador |
| `npm run db:studio` | Interface visual do banco (Prisma Studio) |

---

## Estrutura

```
prisma/
  schema.prisma          modelo de dados (portável SQLite ↔ PostgreSQL)
  seed.ts                carga inicial
src/
  app/
    (admin)/             painel, ordens, orçamentos, clientes, equipe, links
    montador/            app de campo (celular)
    orcamento/[token]/   formulário público do cliente
    assinar/[token]/     assinatura do cliente pelo próprio celular
    comprovante/[id]/    termo de conclusão para impressão/PDF
    actions/             server actions (regras de escrita + validação)
  components/            UI compartilhada e prancheta de assinatura
  lib/
    negocio.ts           regras centrais (conclusão da OS, financeiro, numeração)
    financeiro.ts        consultas consolidadas do caixa
    auth.ts              sessão, hash de senha, auditoria
  middleware.ts          bloqueio de rotas internas
```

---

## Sobre a assinatura digital

Cada assinatura registra:

- o **traço** desenhado na tela (PNG recortado no traço, pronto para impressão);
- **nome e documento** de quem assinou;
- **data e hora**, **endereço IP** e **navegador** utilizados;
- um **hash SHA-256** que combina OS, valor, assinante e horário — qualquer
  alteração posterior invalida a conferência.

O comprovante impresso traz todos esses dados e cita o Art. 10, §2º da
MP 2.200-2/2001, que reconhece a validade de documentos eletrônicos assinados
por forma acordada entre as partes.

---

<div align="center">
<sub>EC Montagens de Móveis · Convencional • Modulados • Planejados • Reparos</sub>
</div>
