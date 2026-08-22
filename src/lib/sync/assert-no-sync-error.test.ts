import type { PostgrestError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { assertNoSyncError } from "./assert-no-sync-error";

describe("assertNoSyncError", () => {
  it("não lança quando error é null", () => {
    expect(() => assertNoSyncError(null, "pull tasks")).not.toThrow();
  });

  it("lança com contexto quando há erro", () => {
    const error = {
      message: "timeout",
      code: "PGRST",
      details: "",
      hint: "",
      name: "PostgrestError",
    } as PostgrestError;

    expect(() => assertNoSyncError(error, "upsert tasks")).toThrow(
      "sync upsert tasks: timeout",
    );
  });
});
