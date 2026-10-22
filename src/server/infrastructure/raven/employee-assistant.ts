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
      // `getAgent(id)` throws a RavenException ("AI Agent ... doesn't exists") when the agent
      // has not been created yet, so list the agents instead and look for ours.
      const { aiAgents } = await store.ai.getAgents();
      if (aiAgents?.some((agent) => agent.identifier === AGENT_ID)) {
        return;
      }

      await store.ai.createAgent(
        {
          identifier: AGENT_ID,
          name: "Employees Assistant",
          connectionStringName: connectionStringName(),
          systemPrompt: SYSTEM_PROMPT,
          // The client only serializes `sampleObject` from the configuration itself (the second
          // argument of `createAgent` is not forwarded), and it must be non-empty. This is the
          // shape of the free-form answer this app asks for (see `run({ noSchema: true })`).
          sampleObject: JSON.stringify({ answer: "Laura Callahan is the Inside Sales Coordinator." }),
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
        }
      );
    })().catch((error: unknown) => {
      agentReady = undefined;
      throw error;
    });
  }

  return agentReady;
}

export class AssistantNotConfiguredError extends Error {
  /** `license` = the server's license doesn't include AI Agents; `connection-string` otherwise. */
  readonly kind: "license" | "connection-string";

  constructor(cause: unknown, kind: "license" | "connection-string" = "connection-string") {
    super(
      kind === "license"
        ? "This RavenDB instance's license does not include the AI Agents feature."
        : "RavenDB AI Agents is not configured on this instance (no AI connection string)."
    );
    this.name = "AssistantNotConfiguredError";
    this.kind = kind;
    this.cause = cause;
  }
}

/**
 * Errors RavenDB raises when a database has no usable AI connection string. Provider-side
 * failures (quota, rejected request) are deliberately NOT treated as "not configured" so
 * they surface as a generic error instead of a misleading setup hint. There is no single dedicated exception for
 * "connection string missing" in the client, so we treat this whole family — plus any
 * message mentioning a connection string — as "AI Agents isn't set up yet" rather than
 * a hard failure.
 */
const NOT_CONFIGURED_ERROR_NAMES = new Set(["AiException", "ConfigurationException"]);

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
    if (error instanceof Error && error.name === "LicenseLimitException") {
      throw new AssistantNotConfiguredError(error, "license");
    }
    if (isNotConfiguredError(error)) {
      throw new AssistantNotConfiguredError(error);
    }
    throw error;
  }
}
