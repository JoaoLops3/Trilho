import { vi } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";

type QueryResult = {
  data?: unknown;
  error?: PostgrestError | null;
  count?: number | null;
};

type TableHandler = {
  upsert?: QueryResult | (() => QueryResult | Promise<QueryResult>);
  select?: QueryResult | (() => QueryResult | Promise<QueryResult>);
  delete?: QueryResult | (() => QueryResult | Promise<QueryResult>);
  update?: QueryResult | (() => QueryResult | Promise<QueryResult>);
};

/** Mock enxuto do client Supabase para testes de cloud-sync. */
export function createSupabaseMock(
  tableHandlers: Record<string, TableHandler>,
) {
  const calls: { table: string; op: string; payload?: unknown }[] = [];

  const resolve = (
    value: QueryResult | (() => QueryResult | Promise<QueryResult>),
  ) => (typeof value === "function" ? value() : value);

  const from = vi.fn((table: string) => {
    const handler = tableHandlers[table] ?? {};
    let afterSelect = false;
    let afterUpdate = false;

    const chain = {
      select: vi.fn((payload?: unknown) => {
        calls.push({ table, op: "select", payload });
        afterSelect = true;
        return chain;
      }),
      eq: vi.fn(async (payload?: unknown) => {
        calls.push({ table, op: "eq", payload });
        if (afterSelect) {
          afterSelect = false;
          return resolve(handler.select ?? { data: [], error: null });
        }
        if (afterUpdate) {
          afterUpdate = false;
          return resolve(handler.update ?? { error: null });
        }
        return chain;
      }),
      upsert: vi.fn(async (payload?: unknown) => {
        calls.push({ table, op: "upsert", payload });
        return resolve(handler.upsert ?? { error: null });
      }),
      delete: vi.fn(() => {
        calls.push({ table, op: "delete" });
        return {
          in: vi.fn(async (payload?: unknown) => {
            calls.push({ table, op: "delete.in", payload });
            return resolve(handler.delete ?? { error: null });
          }),
        };
      }),
      update: vi.fn((payload?: unknown) => {
        calls.push({ table, op: "update", payload });
        afterUpdate = true;
        return chain;
      }),
      order: vi.fn(() => chain),
      limit: vi.fn(async () =>
        resolve(handler.select ?? { data: [], error: null }),
      ),
      maybeSingle: vi.fn(async () =>
        resolve(handler.select ?? { data: null, error: null }),
      ),
    };

    return chain;
  });

  return { client: { from }, calls };
}

export function authError(message: string, code?: string): PostgrestError {
  return {
    message,
    code: code ?? "PGRST",
    details: "",
    hint: "",
    name: "PostgrestError",
  } as PostgrestError;
}
