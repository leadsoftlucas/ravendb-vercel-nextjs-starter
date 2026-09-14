"use client";

import { useState, useTransition } from "react";
import { askAssistantAction } from "@/app/assistant/actions";
import styles from "./AssistantChat.module.css";

type Message = { role: "user" | "assistant" | "system"; text: string };

export function AssistantChat() {
  const [conversationId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const trimmed = question.trim();
    if (!trimmed || isPending) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");

    startTransition(async () => {
      const result = await askAssistantAction(conversationId, trimmed);
      if (result.ok) {
        setMessages((prev) => [...prev, { role: "assistant", text: result.answer }]);
        return;
      }
      if (result.reason === "not-configured") {
        setDisabled(true);
      }
      setMessages((prev) => [...prev, { role: "system", text: result.message }]);
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.history}>
        {messages.length === 0 && (
          <p className={styles.hint}>
            Ask about the Northwind team — e.g. &ldquo;who has a background in sales?&rdquo; or
            &ldquo;tell me about Andrew Fuller&rdquo;.
          </p>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`${styles.bubble} ${styles[message.role]}`}>
            {message.text}
          </div>
        ))}
        {isPending && <div className={`${styles.bubble} ${styles.assistant}`}>Thinking…</div>}
      </div>

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <input
          className={styles.input}
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about the Northwind team…"
          disabled={disabled || isPending}
          aria-label="Message the employee assistant"
        />
        <button className={styles.button} type="submit" disabled={disabled || isPending}>
          Send
        </button>
      </form>
    </div>
  );
}
