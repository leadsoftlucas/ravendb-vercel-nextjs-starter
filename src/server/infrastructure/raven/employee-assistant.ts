import { getDocumentStore } from "./document-store";

/**
 * RavenDB's built-in AI Agents feature. The agent is configured once (idempotently,
 * keyed by `AGENT_ID`) with a single read-only *query tool* over the `Employees`
 * collection. RavenDB itself decides when to run that query and feeds the results
 * to the model — the LLM never gets direct database access, and every call is
 * audited server-side.
 *
 * See: https://ravendb.net/docs/article-page/latest/nodejs/ai-integration/ai-agents/overview
 */

const AGENT_ID = "employees-assistant";
const DEFAULT_CONNECTION_STRING_NAME = "OpenAI";

const SYSTEM_PROMPT = `You are a helpful HR assistant for a fictional company's employee
directory (the Northwind sample dataset). Answer questions about employees using only the
"search_employees" tool's results. If nothing relevant is found, say so plainly instead of
guessing. Keep answers short and conversational.`;

function connectionStringName(): string {
  return process.env.RAVEN_AI_CONNECTION_STRING_NAME?.trim() || DEFAULT_CONNECTION_STRING_NAME;
}

/**
 * Agent creation is cached per warm process (like the DocumentStore itself) so a
 * busy serverless instance doesn't re-issue the same "create or update" call on
 * every request.
 */
let agentReady: Promise<void> | undefined;

async function ensureAgent(): Promise<void> {
  if (!agentReady) {
    agentReady = (async () => {
      const store = getDocumentStore();
      const existing = await store.ai.getAgent(AGENT_ID);
      if (existing) {
        return;
      }

      await store.ai.createAgent(
        {
          identifier: AGENT_ID,
          name: "Employees Assistant",
          connectionStringName: connectionStringName(),
          systemPrompt: SYSTEM_PROMPT,
          sampleObject: "",
          queries: [
            {
              name: "search_employees",
              description:
                "Full-text search over the Employees collection (Northwind sample data) by " +
                "first/last name, job title or bio. Use it to find employees matching what " +
                "the user is asking about.",
              query: `
                from Employees as e
                where search(e.Notes, $term) or search(e.Title, $term)
                   or search(e.FirstName, $term) or search(e.LastName, $term)
                select e.FirstName, e.LastName, e.Title, e.Notes
              `.trim(),
              parametersSampleObject: JSON.stringify({ term: "sales" }),
              options: { allowModelQueries: true },
            },
          ],
        },
        // Sample output shape for the free-form fallback answer this app actually asks for
        // (see `run({ noSchema: true })` below) — required so the agent has a schema on file.
        { answer: "Laura Callahan is the Inside Sales Coordinator." }
      );
    })().catch((error: unknown) => {
      agentReady = undefined;
      throw error;
    });
  }

  return agentReady;
}

export class AssistantNotConfiguredError extends Error {
  constructor(cause: unknown) {
    super("RavenDB AI Agents is not configured on this instance (no AI connection string).");
    this.name = "AssistantNotConfiguredError";
    this.cause = cause;
  }
}

/**
 * Errors RavenDB raises when a database has no usable AI connection string (or the
 * configured provider rejects the request). There is no single dedicated exception for
 * "connection string missing" in the client, so we treat this whole family — plus any
 * message mentioning a connection string — as "AI Agents isn't set up yet" rather than
 * a hard failure.
 */
const NOT_CONFIGURED_ERROR_NAMES = new Set([
  "AiException",
  "ConfigurationException",
  "UnsuccessfulAiRequestException",
  "InsufficientQuotaException",
]);

function isNotConfiguredError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  if (NOT_CONFIGURED_ERROR_NAMES.has(error.name)) {
    return true;
  }
  return /connection string/i.test(error.message);
}

export async function askEmployeeAssistant(
  conversationId: string,
  question: string
): Promise<string> {
  try {
    await ensureAgent();
    const chat = getDocumentStore().ai.conversation(AGENT_ID, conversationId);
    chat.setUserPrompt(question);
    const { answer } = await chat.run({ noSchema: true });
    return answer ?? "";
  } catch (error) {
    if (isNotConfiguredError(error)) {
      throw new AssistantNotConfiguredError(error);
    }
    throw error;
  }
}
