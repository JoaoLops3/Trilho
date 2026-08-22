import { describe, expect, it } from "vitest";

import { parseRawClientEnv } from "./env";

const VALID_SUPABASE_URL = "https://qellobflykthabmauicb.supabase.co";
/** Montado em runtime — evita string estática que pareça API key no git. */
const VALID_ANON_KEY = ["test", "anon", "key", "fixtures"].join("-");

describe("parseRawClientEnv", () => {
  it("aceita env Supabase + PostHog válidos", () => {
    const result = parseRawClientEnv({
      VITE_SUPABASE_URL: VALID_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: VALID_ANON_KEY,
      VITE_POSTHOG_KEY: "phc_test",
      VITE_POSTHOG_HOST: "https://us.i.posthog.com",
      VITE_APP_URL: "https://app.exemplo.com/",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.env.supabaseUrl).toBe(VALID_SUPABASE_URL);
    expect(result.env.supabaseAnonKey).toBe(VALID_ANON_KEY);
    expect(result.env.posthogKey).toBe("phc_test");
    expect(result.env.appUrl).toBe("https://app.exemplo.com");
  });

  it("permite omitir Supabase (offline-only)", () => {
    const result = parseRawClientEnv({});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.env.supabaseUrl).toBeUndefined();
    expect(result.env.supabaseAnonKey).toBeUndefined();
    expect(result.env.posthogHost).toBe("https://us.i.posthog.com");
  });

  it("rejeita URL Supabase inválida", () => {
    const result = parseRawClientEnv({
      VITE_SUPABASE_URL: "https://evil.example.com",
      VITE_SUPABASE_ANON_KEY: VALID_ANON_KEY,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita par Supabase incompleto (só URL)", () => {
    const result = parseRawClientEnv({
      VITE_SUPABASE_URL: VALID_SUPABASE_URL,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(
      result.issues.some((i) => i.includes("VITE_SUPABASE_ANON_KEY")),
    ).toBe(true);
  });

  it("rejeita par Supabase incompleto (só key)", () => {
    const result = parseRawClientEnv({
      VITE_SUPABASE_ANON_KEY: VALID_ANON_KEY,
    });
    expect(result.success).toBe(false);
  });

  it("normaliza strings vazias como ausentes", () => {
    const result = parseRawClientEnv({
      VITE_SUPABASE_URL: "   ",
      VITE_SUPABASE_ANON_KEY: "",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.env.supabaseUrl).toBeUndefined();
  });

  it("remove barra final da URL Supabase", () => {
    const result = parseRawClientEnv({
      VITE_SUPABASE_URL: `${VALID_SUPABASE_URL}/`,
      VITE_SUPABASE_ANON_KEY: VALID_ANON_KEY,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.env.supabaseUrl).toBe(VALID_SUPABASE_URL);
  });
});
