<div align="center">

# RavenDB + Next.js Starter for Vercel

**🇺🇸 English** · [🇧🇷 Português (Brasil)](README.pt-BR.md)

Next.js starter fully wired to **RavenDB Cloud** — deploy live on Vercel in one click, with
document storage and native full-text search built in.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fleadsoftlucas%2Fravendb-vercel-nextjs-starter&env=RAVEN_URLS,RAVEN_DATABASE,RAVEN_CERTIFICATE_BASE64,RAVEN_CERTIFICATE_PASSWORD&envDescription=RavenDB%20Cloud%20connection%20settings%20%E2%80%94%20see%20the%20README&envLink=https%3A%2F%2Fgithub.com%2Fleadsoftlucas%2Fravendb-vercel-nextjs-starter%232-get-a-ravendb-cloud-instance&project-name=ravendb-vercel-nextjs-starter&repository-name=ravendb-vercel-nextjs-starter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![RavenDB](https://img.shields.io/badge/RavenDB-Cloud-b3131e)](https://ravendb.net/cloud)
[![npm: ravendb](https://img.shields.io/npm/v/ravendb?label=ravendb)](https://www.npmjs.com/package/ravendb)

</div>

## What this is

A small, real, working reference app — not a toy CRUD demo — that shows the two things
developers most often ask about **RavenDB**: how to store JSON documents from a Node.js app,
and how to run **full-text search** natively, without bolting on Elasticsearch, Algolia, or
any other external search service.

The app is an **employee directory with search**, built on top of the **Northwind** dataset
that RavenDB can generate automatically for every new database — so there is no seed script to
run and no data to import. Clone, deploy, connect, done.

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database:** [RavenDB Cloud](https://ravendb.net/cloud) via the official [`ravendb`](https://www.npmjs.com/package/ravendb) npm client
- **Search:** RavenDB's built-in full-text search (Lucene-backed auto-indexes) — no separate search service
- **Hosting:** [Vercel](https://vercel.com), one-click deploy

## Why RavenDB + Next.js

RavenDB is a transactional, distributed **NoSQL document database** with ACID guarantees,
built-in full-text and vector search, and a first-class Node.js client. Paired with Next.js on
Vercel, it lets you ship a complete data-backed application — storage, query, and search — on a
serverless deployment with no extra infrastructure to run yourself.

## How it works

```
Browser ──▶ Next.js App Router (Server Components)
                 │
                 ▼
        Application layer (use-cases)
                 │
                 ▼
     Infrastructure layer (RavenDB repository)
                 │
                 ▼
        ravendb npm client — DocumentStore
                 │
                 ▼
          RavenDB Cloud (Northwind DB)
```

- **`src/server/domain`** — plain TypeScript types describing the `Employees` collection shape. No framework or database code.
- **`src/server/application`** — use-cases (`listEmployees`, `searchEmployees`, `getEmployee`). This is the only layer the UI talks to.
- **`src/server/infrastructure/raven`** — the only place that imports `ravendb`. Owns the shared `DocumentStore` singleton and the RavenDB queries.
- **`src/app`** — Next.js routes (Server Components) and the search UI.

This separation follows the layering **Vercel recommends for Next.js apps** (keep data access
out of components, isolate server-only code) and basic **DDD** boundaries (domain has no
infrastructure dependency; infrastructure is swappable behind the application layer) — so the
RavenDB-specific code stays in one place and isn't scattered across the UI.

### The search query

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

Consecutive `.search()` calls on different fields are combined with **OR** by RavenDB, so this
single query matches the term against an employee's bio, title, or name. RavenDB creates and
maintains the backing auto-index automatically — there is no index to hand-write for this to
work.

### The DocumentStore

A RavenDB `DocumentStore` manages connection pooling and cluster topology for the whole
process and must be created **once** and reused — not per request. `src/server/infrastructure/raven/document-store.ts`
caches a single instance on `globalThis` so it survives Next.js dev-server hot reloads and is
reused across warm serverless invocations on Vercel, per RavenDB's own guidance for [using
RavenDB from serverless applications](https://ravendb.net/articles/using-ravendb-from-serverless-applications).

## Get a RavenDB Cloud instance

1. Create a free account at [cloud.ravendb.net](https://cloud.ravendb.net) and provision an
   instance (the Free tier is enough for this starter).
2. Open **RavenDB Studio** for your instance, go to **Settings → Create Sample Data**, and
   generate the **Northwind** dataset. This creates the `Employees` collection this app reads.
3. In the RavenDB Cloud portal, open your instance's **Products** tab to find its **cluster
   URL**, and note the **database name** (`Northwind`, unless you renamed it).
4. RavenDB Cloud instances are secured by default. From the same portal, download the
   **client certificate** (`.pfx`) for your instance.
5. Base64-encode the certificate — you'll paste this single string into Vercel, not the file
   itself:

   ```bash
   # macOS / Linux
   base64 -i your-cert.pfx | tr -d '\n'
   ```

   ```powershell
   # Windows PowerShell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("your-cert.pfx"))
   ```

See the official guide for more detail: [Connecting a Node.js application to RavenDB
Cloud](https://ravendb.net/articles/connecting-node-js-application-to-ravendb-cloud).

## Deploy to Vercel

Click the button above, or connect this repo manually, and provide these environment
variables when prompted:

| Variable                    | Required | Description                                                                 |
| ---------------------------- | -------- | ----------------------------------------------------------------------------- |
| `RAVEN_URLS`                 | Yes      | Comma-separated RavenDB Cloud cluster URL(s), e.g. `https://a.free.ravendb.cloud` |
| `RAVEN_DATABASE`             | Yes      | Database name, e.g. `Northwind`                                              |
| `RAVEN_CERTIFICATE_BASE64`   | Yes\*    | Base64-encoded `.pfx` client certificate                                      |
| `RAVEN_CERTIFICATE_PASSWORD` | No       | Certificate password, if you set one when generating it                       |

\* Required for RavenDB Cloud (secured by default). Only omit `RAVEN_CERTIFICATE_BASE64` for an
unsecured local `http://` RavenDB instance.

Only the variable **names** are ever exposed by the Deploy Button link above — never values or
secrets.

## Run locally

```bash
git clone https://github.com/leadsoftlucas/ravendb-vercel-nextjs-starter.git
cd ravendb-vercel-nextjs-starter
npm install
cp .env.example .env.local   # then fill in your RavenDB Cloud values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/                          Next.js App Router routes (UI)
  components/                   Client search UI + presentational components
  server/
    domain/employee.ts          Employee type — no framework/DB code
    application/                Use-cases the UI calls (listEmployees, searchEmployees, getEmployee)
    infrastructure/raven/       DocumentStore singleton + RavenDB queries (the only place `ravendb` is imported)
```

## License

[MIT](LICENSE) © 2026 [Lucas R. Tavares](https://github.com/leadsoftlucas)

This is an independent, open-source starter template built to demonstrate **RavenDB** on
**Vercel**. It is not an official RavenDB product; **RavenDB** and **RavenDB Cloud** are
products of [Hibernating Rhinos Ltd.](https://ravendb.net) — see their site for licensing of
the database itself.
