"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ maxWidth: 640, margin: "4rem auto", padding: "0 1.5rem" }}>
      <h1>Something went wrong</h1>
      <p>
        The app couldn&apos;t load data from RavenDB. Check that <code>RAVEN_URLS</code>,{" "}
        <code>RAVEN_DATABASE</code> and the client certificate variables are set correctly (see
        the README) and that the instance is reachable.
      </p>
      <p>
        <button type="button" onClick={() => reset()}>
          Try again
        </button>{" "}
        <Link href="/">Back to directory</Link>
      </p>
    </main>
  );
}
