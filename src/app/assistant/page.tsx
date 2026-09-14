import Link from "next/link";
import type { Metadata } from "next";
import { AssistantChat } from "@/components/AssistantChat";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Ask the Employee Assistant — RavenDB AI Agents demo",
  description:
    "Chat with a RavenDB AI Agent over the Northwind Employees collection — a native, " +
    "auditable RavenDB feature, not an external AI orchestration service.",
};

export default function AssistantPage() {
  return (
    <main className={styles.main}>
      <Link className={styles.back} href="/">
        ← Back to directory
      </Link>

      <div className={styles.header}>
        <span className={styles.eyebrow}>RavenDB AI Agents</span>
        <h1 className={styles.title}>Ask about the Northwind team</h1>
        <p className={styles.subtitle}>
          This chat is answered by a RavenDB <strong>AI Agent</strong> running server-side: the
          model can only call a read-only query tool RavenDB itself exposes over the{" "}
          <code>Employees</code> collection — it never touches the database directly, and every
          call is audited. If this instance has no AI connection string configured yet,
          you&apos;ll see a message below instead of a crash (see the README).
        </p>
      </div>

      <AssistantChat />
    </main>
  );
}
