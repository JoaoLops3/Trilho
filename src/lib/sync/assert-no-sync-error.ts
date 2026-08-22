import type { PostgrestError } from "@supabase/supabase-js";

export function assertNoSyncError(
  error: PostgrestError | null,
  context: string,
): void {
  if (error) {
    throw new Error(`sync ${context}: ${error.message}`);
  }
}
