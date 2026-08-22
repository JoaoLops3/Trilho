/**
 * Guardrails de segurança estáticos — regressões viram falha de CI.
 * Roda: node --test scripts/validate-security.mjs
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function walkSrc(dir = join(root, "src"), acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkSrc(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

function relPath(abs) {
  return relative(root, abs).replaceAll("\\", "/");
}

describe("security — segredos e XSS no client", () => {
  const srcFiles = walkSrc();

  it("nenhum service_role / SUPABASE_SERVICE_ROLE em src/", () => {
    const forbidden = /SUPABASE_SERVICE_ROLE|service_role_key/i;
    for (const file of srcFiles) {
      const rel = relPath(file);
      const src = readFileSync(file, "utf8");
      if (rel === "src/lib/env.ts") {
        // Comentário/guard dev em warnPrivilegedViteEnv — única exceção.
        const withoutWarn = src.replace(
          /export function warnPrivilegedViteEnv[\s\S]*?\n\}/,
          "",
        );
        assert.doesNotMatch(
          withoutWarn,
          forbidden,
          `${rel} referencia chave privilegiada`,
        );
        continue;
      }
      assert.doesNotMatch(
        src,
        forbidden,
        `${rel} referencia chave privilegiada`,
      );
    }
  });

  it("nenhum dangerouslySetInnerHTML / .innerHTML em src/", () => {
    for (const file of srcFiles) {
      const rel = relPath(file);
      const src = readFileSync(file, "utf8");
      assert.doesNotMatch(src, /dangerouslySetInnerHTML/, rel);
      assert.doesNotMatch(src, /\.innerHTML\s*=/, rel);
    }
  });
});

describe("security — módulos críticos", () => {
  it("supabase.ts usa clientEnv + authStorage (anon only)", () => {
    const supabase = read("src/lib/supabase.ts");
    assert.match(supabase, /from "\.\/env"/);
    assert.match(supabase, /authStorage/);
    assert.doesNotMatch(supabase, /import\.meta\.env\.VITE_SUPABASE/);
    assert.doesNotMatch(supabase, /service_role/i);
  });

  it("env.ts alerta chaves VITE_ privilegiadas em dev", () => {
    assert.match(read("src/lib/env.ts"), /warnPrivilegedViteEnv/);
    assert.match(read("src/lib/env.ts"), /service_role/i);
  });

  it("auth-errors.ts — mensagem genérica; mapAuthError sem vazar error.message", () => {
    const auth = read("src/lib/auth-errors.ts");
    assert.match(auth, /GENERIC_AUTH_ERROR/);
    assert.doesNotMatch(auth, /return error\.message/);
    assert.match(auth, /return GENERIC_AUTH_ERROR/);
  });

  it("secure-auth-storage.ts — Keychain/Keystore no nativo", () => {
    const storage = read("src/lib/secure-auth-storage.ts");
    assert.match(storage, /@aparajita\/capacitor-secure-storage/);
    assert.match(storage, /SecureStorage/);
    assert.match(storage, /isNativePlatform/);
  });

  it("analytics-task.ts — sem PII (task.title)", () => {
    const analytics = read("src/lib/analytics-task.ts");
    assert.doesNotMatch(analytics, /task\.title/);
    assert.match(analytics, /task_id/);
  });

  it("posthog.ts — init só após consentimento", () => {
    const posthog = read("src/lib/posthog.ts");
    assert.match(posthog, /getAnalyticsConsent/);
    assert.match(posthog, /getAnalyticsConsent\(\) !== "granted"/);
  });

  it("observability.ts — surface storage", () => {
    assert.match(read("src/lib/observability.ts"), /"storage"/);
  });
});

describe("security — repo e CI", () => {
  it(".gitignore ignora .env e .env.*", () => {
    const gitignore = read(".gitignore");
    assert.match(gitignore, /^\.env$/m);
    assert.match(gitignore, /^\.env\.\*$/m);
  });

  it("workflow secret-scan.yml existe", () => {
    const workflow = read(".github/workflows/secret-scan.yml");
    assert.match(workflow, /gitleaks|secret/i);
  });

  it("script test:security no package.json", () => {
    assert.match(
      read("package.json"),
      /"test:security": "node --test scripts\/validate-security.mjs"/,
    );
  });

  it("telas auth importam auth-validation", () => {
    for (const path of [
      "src/screens/LoginScreen.tsx",
      "src/screens/ForgotPasswordScreen.tsx",
      "src/screens/NewPasswordScreen.tsx",
      "src/components/AuthScreenLayout.tsx",
    ]) {
      assert.match(
        read(path),
        /auth-validation/,
        `${path} deve usar auth-validation`,
      );
    }
  });
});
