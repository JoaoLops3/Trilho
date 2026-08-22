import { vi } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";

type QueryResult = {
  data?: unknown;
  error?: PostgrestError | null;
  count?: number | null;
};

/** Mock enxuto do client Supabase para testes de cloud-sync. */
export function createSupabaseMock(
  tableHandlers: Record<
    string,
    {
      upsert?: QueryResult | (() => QueryResult | Promise<QueryResult>);
      select?: QueryResult | (() => QueryResult | Promise<QueryResult>);
      delete?: QueryResult | (() => QueryResult | Promise<QueryResult>);
      update?: QueryResult | (() => QueryResult | Promise<QueryResult>);
    }
  >,
) {
  const calls: { table: string; op: string; args: unknown[] }[] = [];

  const resolve = (
    value: QueryResult | (() => QueryResult | Promise<QueryResult>),
  ) => (typeof value === "function" ? value() : value);

  const from = vi.fn((table: string) => {
    const handler = tableHandlers[table] ?? {};

    const chain = {
      select: vi.fn((...args: unknown[]) => {
        calls.push({ table, op: "select", args });
        return chain;
      }),
      eq: vi.fn((...args: unknown[]) => {
        calls.push({ table, op: "eq", args });
        return chain;
      }),
      order: vi.fn((...args: unknown[]) => {
        calls.push({ table, op: "order", args });
        return chain;
      }),
      limit: vi.fn(async (...args: unknown[]) => {
        calls.push({ table, op: "limit", args });
        return resolve(handler.select ?? { data: [], error: null });
      }),
      upsert: vi.fn(async (...args: unknown[]) => {
        calls.push({ table, op: "upsert", args });
        return resolve(handler.upsert ?? { error: null });
      }),
      delete: vi.fn((...args: unknown[]) => {
        calls.push({ table, op: "delete", args });
        return chain;
      }),
      in: vi.fn(async (...args: unknown[]) => {
        calls.push({ table, op: "in", args });
        return resolve(handler.delete ?? { error: null });
      }),
      update: vi.fn((...args: unknown[]) => {
        calls.push({ table, op: "update", args });
        return chain;
      }),
      maybeSingle: vi.fn(async (...args: unknown[]) => {
        calls.push({ table, op: "maybeSingle", args });
        return resolve(handler.select ?? { data: null, error: null });
      }),
      then: undefined as unknown,
    };

    // select().eq() termina com Promise (PostgREST head/count ou select normal)
    chain.eq.mockImplementation((...args: unknown[]) => {
      calls.push({ table, op: "eq", args });
      const lastOp = calls.at(-2)?.op;
      if (lastOp === "select") {
        return resolve(handler.select ?? { data: [], error: null });
      }
      if (lastOp === "update") {
        return resolve(handler.update ?? { error: null });
      }
      return chain;
    });

    return chain;
  });

  return { client: { from }, calls };
}

export function authError(
  message: string,
  code?: string,
): PostgrestError {
  return {
    message,
    code: code ?? "PGRST",
    details: "",
    hint: "",
    name: "PostgrestError",
  } as PostgrestError;
}
