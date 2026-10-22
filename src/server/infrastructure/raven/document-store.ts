import { DocumentStore } from "ravendb";
import type { IAuthOptions, IStoreAuthOptions } from "ravendb";

/**
 * A RavenDB `DocumentStore` manages connection pooling, caching and topology
 * awareness for the whole process — it must be created exactly once and reused
 * across every request. Re-creating it per request (or per serverless
 * invocation) throws that away and re-negotiates the cluster topology every time.
 *
 * We cache the instance on `globalThis` so it survives Next.js dev-server hot
 * reloads and is reused across warm serverless invocations on Vercel.
 */

declare global {
  var __ravenDocumentStore: DocumentStore | undefined;
}

function readAuthOptions(): IStoreAuthOptions | undefined {
  const certificateBase64 = process.env.RAVEN_CERTIFICATE_BASE64;
  if (!certificateBase64) {
    // Unsecured instance (e.g. a local `http://` RavenDB server) — no client
    // certificate needed. RavenDB Cloud instances are secured by default.
    return undefined;
  }

  const authOptions: IAuthOptions = {
    type: "pfx",
    certificate: Buffer.from(certificateBase64, "base64"),
    password: process.env.RAVEN_CERTIFICATE_PASSWORD || undefined,
  };

  return authOptions;
}

function createDocumentStore(): DocumentStore {
  const urls = (process.env.RAVEN_URLS ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  const database = process.env.RAVEN_DATABASE?.trim();

  if (urls.length === 0 || !database) {
    throw new Error(
      "Missing RavenDB configuration. Set RAVEN_URLS and RAVEN_DATABASE " +
        "(see .env.example) — typically your RavenDB Cloud cluster URL and database name."
    );
  }

  const authOptions = readAuthOptions();
  const store = authOptions
    ? new DocumentStore(urls, database, authOptions)
    : new DocumentStore(urls, database);
  // Northwind documents expose their id as `Id` in our domain type; the client's
  // default identity property is lower-case `id`, which would leave `Employee.Id`
  // undefined (broken links / React keys).
  store.conventions.identityProperty = "Id";
  store.initialize();
  return store;
}

export function getDocumentStore(): DocumentStore {
  if (!globalThis.__ravenDocumentStore) {
    globalThis.__ravenDocumentStore = createDocumentStore();
  }
  return globalThis.__ravenDocumentStore;
}

export function isRavenConfigured(): boolean {
  return Boolean(process.env.RAVEN_URLS?.trim() && process.env.RAVEN_DATABASE?.trim());
}
