<div align="center">

# RavenDB + Next.js Starter para Vercel

[🇺🇸 English](README.md) · **🇧🇷 Português (Brasil)**

Starter Next.js totalmente integrado ao **RavenDB Cloud** — deploy na Vercel em um clique,
com armazenamento de documentos e busca full-text nativa já embutidos.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fleadsoftlucas%2Fravendb-vercel-nextjs-starter&env=RAVEN_URLS,RAVEN_DATABASE,RAVEN_CERTIFICATE_BASE64,RAVEN_CERTIFICATE_PASSWORD&envDescription=RavenDB%20Cloud%20connection%20settings%20%E2%80%94%20see%20the%20README&envLink=https%3A%2F%2Fgithub.com%2Fleadsoftlucas%2Fravendb-vercel-nextjs-starter%232-get-a-ravendb-cloud-instance&project-name=ravendb-vercel-nextjs-starter&repository-name=ravendb-vercel-nextjs-starter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![RavenDB](https://img.shields.io/badge/RavenDB-Cloud-b3131e)](https://ravendb.net/cloud)
[![npm: ravendb](https://img.shields.io/npm/v/ravendb?label=ravendb)](https://www.npmjs.com/package/ravendb)

</div>

## O que é este repositório

Um app pequeno, real e funcional — não um CRUD de brinquedo — que demonstra as duas coisas
que desenvolvedores mais perguntam sobre o **RavenDB**: como armazenar documentos JSON a
partir de uma aplicação Node.js, e como rodar **busca full-text** de forma nativa, sem depender
de Elasticsearch, Algolia ou qualquer outro serviço de busca externo.

O app é um **diretório de funcionários com busca**, construído sobre o dataset **Northwind**
que o próprio RavenDB gera automaticamente em qualquer banco novo — ou seja, não há script de
seed para rodar nem dados para importar. Clonou, fez deploy, conectou, pronto.

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Banco de dados:** [RavenDB Cloud](https://ravendb.net/cloud) via cliente oficial [`ravendb`](https://www.npmjs.com/package/ravendb) do npm
- **Busca:** full-text search nativa do RavenDB (auto-índices baseados em Lucene) — sem serviço de busca separado
- **Hospedagem:** [Vercel](https://vercel.com), deploy em um clique

## Por que RavenDB + Next.js

RavenDB é um **banco de dados NoSQL orientado a documentos**, transacional e distribuído, com
garantias ACID, busca full-text e vetorial nativas, e um cliente Node.js de primeira classe.
Combinado ao Next.js na Vercel, ele permite lançar uma aplicação completa com dados —
armazenamento, consulta e busca — em um deploy serverless, sem infraestrutura extra para você
operar.

## Como funciona

```
Navegador ──▶ Next.js App Router (Server Components)
                    │
                    ▼
          Camada de aplicação (casos de uso)
                    │
                    ▼
      Camada de infraestrutura (repositório RavenDB)
                    │
                    ▼
         Cliente npm ravendb — DocumentStore
                    │
                    ▼
           RavenDB Cloud (banco Northwind)
```

- **`src/server/domain`** — tipos TypeScript simples descrevendo a coleção `Employees`. Sem código de framework ou de banco de dados.
- **`src/server/application`** — casos de uso (`listEmployees`, `searchEmployees`, `getEmployee`). É a única camada com a qual a UI conversa.
- **`src/server/infrastructure/raven`** — o único lugar que importa `ravendb`. Mantém o `DocumentStore` compartilhado (singleton) e as queries do RavenDB.
- **`src/app`** — rotas do Next.js (Server Components) e a UI de busca.

Essa separação segue a organização em camadas que a **Vercel recomenda para apps Next.js**
(manter acesso a dados fora dos componentes, isolar código server-only) e limites básicos de
**DDD** (o domínio não depende de infraestrutura; a infraestrutura é substituível por trás da
camada de aplicação) — assim, o código específico do RavenDB fica concentrado em um só lugar,
em vez de espalhado pela UI.

### A query de busca

```ts
// src/server/infrastructure/raven/employee-repository.ts
const session = getDocumentStore().openSession();
return session
  .query<Employee>({ collection: "Employees" })
  .search("Notes", term)
  .search("Title", term)
  .search("FirstName", term)
  .search("LastName", term)
  .take(limit)
  .all();
```

Chamadas sucessivas de `.search()` em campos diferentes são combinadas com **OR** pelo
RavenDB, então essa única query casa o termo buscado contra a biografia, o cargo ou o nome do
funcionário. O RavenDB cria e mantém o auto-índice correspondente automaticamente — não há
índice para escrever manualmente para isso funcionar.

### O DocumentStore

Um `DocumentStore` do RavenDB gerencia o pool de conexões e a topologia do cluster para todo o
processo, e deve ser criado **uma única vez** e reutilizado — nunca por requisição.
`src/server/infrastructure/raven/document-store.ts` mantém uma única instância em cache no
`globalThis`, de forma que ela sobrevive aos hot reloads do servidor de desenvolvimento do
Next.js e é reaproveitada entre invocações "quentes" da função serverless na Vercel, seguindo a
própria orientação do RavenDB para [usar o RavenDB em aplicações
serverless](https://ravendb.net/articles/using-ravendb-from-serverless-applications).

## Obtenha uma instância no RavenDB Cloud

1. Crie uma conta gratuita em [cloud.ravendb.net](https://cloud.ravendb.net) e provisione uma
   instância (o tier Free já é suficiente para este starter).
2. Abra o **RavenDB Studio** da sua instância, vá em **Settings → Create Sample Data** e
   gere o dataset **Northwind**. Isso cria a coleção `Employees` que este app lê.
3. No portal do RavenDB Cloud, abra a aba **Products** da sua instância para encontrar a
   **URL do cluster** e anote o **nome do banco de dados** (`Northwind`, a menos que você o
   tenha renomeado).
4. Instâncias do RavenDB Cloud são seguras (HTTPS + certificado) por padrão. No mesmo portal,
   baixe o **certificado de cliente** (`.pfx`) da sua instância.
5. Converta o certificado para base64 — você vai colar essa string única na Vercel, não o
   arquivo em si:

   <details>
   <summary>Comando base64 (macOS/Linux ou Windows PowerShell)</summary>

   ```bash
   # macOS / Linux
   base64 -i seu-certificado.pfx | tr -d '\n'
   ```

   ```powershell
   # Windows PowerShell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("seu-certificado.pfx"))
   ```

   </details>

Veja o guia oficial para mais detalhes: [Connecting a Node.js application to RavenDB
Cloud](https://ravendb.net/articles/connecting-node-js-application-to-ravendb-cloud).

## Deploy na Vercel

Clique no botão acima, ou conecte este repositório manualmente, e informe estas variáveis de
ambiente quando solicitado:

| Variável                      | Obrigatória | Descrição                                                                        |
| ------------------------------ | ----------- | ----------------------------------------------------------------------------------- |
| `RAVEN_URLS`                   | Sim         | URL(s) do cluster RavenDB Cloud, separadas por vírgula, ex.: `https://a.free.ravendb.cloud` |
| `RAVEN_DATABASE`               | Sim         | Nome do banco de dados, ex.: `Northwind`                                            |
| `RAVEN_CERTIFICATE_BASE64`     | Sim\*       | Certificado de cliente `.pfx` codificado em base64                                   |
| `RAVEN_CERTIFICATE_PASSWORD`   | Não         | Senha do certificado, se você definiu uma ao gerá-lo                                |

\* Obrigatória para o RavenDB Cloud (seguro por padrão). Só deixe `RAVEN_CERTIFICATE_BASE64`
em branco para uma instância RavenDB local e não segura (`http://`).

O link do Deploy Button acima expõe apenas os **nomes** das variáveis — nunca valores ou
segredos.

## Rodando localmente

```bash
git clone https://github.com/leadsoftlucas/ravendb-vercel-nextjs-starter.git
cd ravendb-vercel-nextjs-starter
npm install
cp .env.example .env.local   # depois preencha com os dados da sua instância RavenDB Cloud
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Estrutura do projeto

```
src/
  app/                          Rotas do Next.js App Router (UI)
  components/                   UI de busca (client) + componentes de apresentação
  server/
    domain/employee.ts          Tipo Employee — sem código de framework/banco
    application/                Casos de uso chamados pela UI (listEmployees, searchEmployees, getEmployee)
    infrastructure/raven/       DocumentStore singleton + queries do RavenDB (único lugar que importa `ravendb`)
```

## Licença

[MIT](LICENSE) © 2026 [Lucas R. Tavares](https://github.com/leadsoftlucas)

Este é um starter template independente e open-source, criado para demonstrar o **RavenDB** na
**Vercel**. Não é um produto oficial do RavenDB; **RavenDB** e **RavenDB Cloud** são produtos da
[Hibernating Rhinos Ltd.](https://ravendb.net) — consulte o site oficial para o licenciamento
do banco de dados em si.
