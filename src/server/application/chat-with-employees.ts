import {
  askEmployeeAssistant,
  AssistantNotConfiguredError,
} from "@/server/infrastructure/raven/employee-assistant";

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

  try {
    const answer = await askEmployeeAssistant(conversationId, trimmed);
    return { ok: true, answer };
  } catch (error) {
    if (error instanceof AssistantNotConfiguredError) {
      return {
        ok: false,
        reason: "not-configured",
        message:
          "AI Agents isn't configured on this RavenDB instance yet — see the README's " +
          "\"AI Agents demo\" section to add an AI connection string.",
      };
    }
    return {
      ok: false,
      reason: "error",
      message: "Something went wrong asking the assistant. Please try again.",
    };
  }
}
