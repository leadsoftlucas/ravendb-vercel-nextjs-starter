import type { Employee } from "@/server/domain/employee";
import { getDocumentStore } from "./document-store";

const COLLECTION = "Employees";

/**
 * Data-access for the "Employees" collection. Every query opens a lightweight
 * session from the shared DocumentStore and disposes it once done — sessions
 * are cheap, unit-of-work objects meant to be short-lived (one per request),
 * unlike the DocumentStore itself.
 */
export const employeeRepository = {
  async findAll(limit = 25): Promise<Employee[]> {
    const session = getDocumentStore().openSession();
    return session
      .query<Employee>({ collection: COLLECTION })
      .orderBy("LastName")
      .take(limit)
      .all();
  },

  async findById(id: string): Promise<Employee | null> {
    const session = getDocumentStore().openSession();
    return session.load<Employee>(id);
  },

  /**
   * Full-text search across name and biography fields.
   *
   * `.search()` runs against a RavenDB auto-index: the server tokenizes and
   * lower-cases the target fields (via the default Lucene analyzer) and RavenDB
   * creates/reuses the matching auto-index automatically — no index needs to be
   * defined by hand for this query to work.
   */
  async search(term: string, limit = 25): Promise<Employee[]> {
    const session = getDocumentStore().openSession();
    return session
      .query<Employee>({ collection: COLLECTION })
      .search("Notes", term)
      .search("Title", term)
      .search("FirstName", term)
      .search("LastName", term)
      .take(limit)
      .all();
  },
};
