"use server";

import {
  chatWithEmployees,
  type ChatWithEmployeesResult,
} from "@/server/application/chat-with-employees";

export async function askAssistantAction(
  conversationId: string,
  question: string
): Promise<ChatWithEmployeesResult> {
  return chatWithEmployees(conversationId, question);
}
