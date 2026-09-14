import Link from "next/link";
import { Suspense } from "react";
import { SearchBar } from "@/components/SearchBar";
import { EmployeeCard } from "@/components/EmployeeCard";
import { searchEmployees } from "@/server/application/search-employees";
import { isRavenConfigured } from "@/server/infrastructure/raven/document-store";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const { q = "" } = await searchParams;
  const employees = await searchEmployees(q);

  if (employees.length === 0) {
    return <p className={styles.empty}>No employees matched &ldquo;{q}&rdquo;.</p>;
  }

  return (
    <div className={styles.results}>
      {employees.map((employee) => (
        <EmployeeCard key={employee.Id} employee={employee} />
      ))}
    </div>
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  const configured = isRavenConfigured();

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>RavenDB + Next.js starter</span>
        <h1 className={styles.title}>Employee directory &amp; full-text search</h1>
        <p className={styles.subtitle}>
          Backed by RavenDB&apos;s built-in <strong>Northwind</strong> sample dataset. Every
          search below runs natively in RavenDB — no Elasticsearch, Algolia, or other search
          service involved.
        </p>
        <p className={styles.subtitle}>
          <Link href="/assistant">Try the RavenDB AI Agents chat →</Link>
        </p>
      </div>

      {configured ? (
        <>
          <SearchBar />
          <Suspense fallback={<p className={styles.empty}>Loading…</p>}>
            <Results searchParams={searchParams} />
          </Suspense>
        </>
      ) : (
        <p className={styles.empty}>
          RavenDB isn&apos;t configured yet. Set <code>RAVEN_URLS</code> and{" "}
          <code>RAVEN_DATABASE</code> (see <code>.env.example</code> and the README) to connect
          this app to your RavenDB Cloud instance.
        </p>
      )}

      <p className={styles.footer}>
        Built with the{" "}
        <a href="https://ravendb.net" target="_blank" rel="noreferrer">
          RavenDB
        </a>{" "}
        Node.js client on Next.js App Router. See{" "}
        <a
          href="https://github.com/leadsoftlucas/ravendb-vercel-nextjs-starter"
          target="_blank"
          rel="noreferrer"
        >
          the source
        </a>{" "}
        for the full-text search query.
      </p>
    </main>
  );
}
