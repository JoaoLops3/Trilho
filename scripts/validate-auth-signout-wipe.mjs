/**
 * Validação estática do wipe local no logout.
 * Roda: node --test scripts/validate-auth-signout-wipe.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("signOut — wipe local", () => {
  const auth = read("src/lib/auth-context.tsx");
  const signOutStart = auth.indexOf("const signOut = useCallback");
  const signOutEnd = auth.indexOf("}, [session, user]);", signOutStart);
  const body = auth.slice(signOutStart, signOutEnd);

  it("importa clearAllLocalAppData", () => {
    assert.match(auth, /import \{ clearAllLocalAppData \} from "\.\/user-data-export"/);
  });

  it("só limpa local quando havia sessão", () => {
    assert.match(body, /hadSession/);
    assert.match(body, /if \(hadSession\)/);
    assert.match(body, /clearAllLocalAppData\(\)/);
  });

  it("clearAllLocalAppData vem antes de supabase.auth.signOut", () => {
    const clearAt = body.indexOf("clearAllLocalAppData()");
    const signOutAt = body.indexOf("supabase.auth.signOut()");
    assert.ok(clearAt >= 0, "clearAllLocalAppData ausente");
    assert.ok(signOutAt >= 0, "signOut ausente");
    assert.ok(clearAt < signOutAt, "wipe deve ocorrer antes do signOut remoto");
  });
});

describe("UI — reload após logout", () => {
  it("ProfileScreen recarrega após signOut", () => {
    const profile = read("src/screens/ProfileScreen.tsx");
    const handleStart = profile.indexOf("const handleSignOut");
    const handleEnd = profile.indexOf("};", handleStart);
    const body = profile.slice(handleStart, handleEnd);
    assert.match(body, /await signOut\(\)/);
    assert.match(body, /window\.location\.reload\(\)/);
  });

  it("NewPasswordScreen recarrega ao cancelar recovery", () => {
    const screen = read("src/screens/NewPasswordScreen.tsx");
    assert.match(screen, /signOut\(\)\.then/);
    assert.match(screen, /window\.location\.reload\(\)/);
  });
});

describe("docs sync-behavior — logout", () => {
  const docs = read("docs/sync-behavior.md");

  it("documenta wipe no signOut e reload da UI", () => {
    assert.match(docs, /clearAllLocalAppData/);
    assert.match(docs, /Logout/i);
    assert.match(docs, /reload/i);
  });
});
