"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import styles from "./SearchBar.module.css";

/**
 * Drives RavenDB full-text search via the `q` URL search param, so results are
 * produced server-side (see `src/app/page.tsx`) and the search stays linkable
 * and shareable — no client-side data fetching or search index required.
 */
export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(searchParams.get("q") ?? "");

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (term.trim()) {
          params.set("q", term.trim());
        } else {
          params.delete("q");
        }
        router.push(`/?${params.toString()}`);
      }}
    >
      <input
        className={styles.input}
        type="search"
        name="q"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search employees by name, title or bio (e.g. “sales”, “French”, “MBA”)"
        aria-label="Full-text search"
      />
      <button className={styles.button} type="submit">
        Search
      </button>
    </form>
  );
}
