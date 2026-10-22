import { isRavenConfigured } from "@/server/infrastructure/raven/document-store";
import {
  askEmployeeAssistant,
  AssistantNotConfiguredError,
} from "@/server/infrastructure/raven/employee-assistant";

const MAX_QUESTION_LENGTH = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ChatWithEmployeesResult =
  | { ok: true; answer: string }
  | { ok: false; reason: "not-configured" | "error"; message: string };

export async function chatWithEmployees(
  conversationId: string,
  question: string
): Promise<ChatWithEmployeesResult> {
  const trimmed = question.trim();
  if (!trimmed) {
    return { ok: false, reason: "error", message: "Ask a question first." };
  }
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return { ok: false, reason: "error", message: "That question is too long. Keep it short." };
  }
  // The id comes from the browser; only accept the UUIDs our client generates so a caller
  // cannot address arbitrary conversation documents.
  if (!UUID_PATTERN.test(conversationId)) {
    return { ok: false, reason: "error", message: "Invalid conversation." };
  }
  if (!isRavenConfigured()) {
    return {
      ok: false,
      reason: "not-configured",
      message:
        "RavenDB isn't configured yet. Set RAVEN_URLS and RAVEN_DATABASE (see the README).",
    };
  }

  try {
    const answer = await askEmployeeAssistant(conversationId, trimmed);
    return { ok: true, answer };
  } catch (error) {
    if (error instanceof AssistantNotConfiguredError) {
      return {
        ok: false,
        reason: "not-configured",
        message:
          error.kind === "license"
            ? "This RavenDB instance's license doesn't include AI Agents — see the README's " +
              "\"AI Agents demo\" section."
            : "AI Agents isn't configured on this RavenDB instance yet — see the README's " +
              "\"AI Agents demo\" section to add an AI connection string.",
      };
    }
    console.error("Employee assistant failed", error);
    return {
      ok: false,
      reason: "error",
      message: "Something went wrong asking the assistant. Please try again.",
    };
  }
}
