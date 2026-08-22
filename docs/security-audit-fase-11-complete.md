# Auditoria de segurança — Fase 11 completa

| Campo | Valor |
|-------|-------|
| Data | 2026-06-27 |
| Escopo | Supabase (schema, RLS, auth, sync), client Capacitor, env, PostHog |
| Projeto | `qellobflykthabmauicb` |
| Gate | **PASS** — zero CRITICAL / HIGH |

## Resumo executivo

Trilho passou de frontend-only para **auth + sync na nuvem**. Auditoria alinhada ao plano [`importância_auditoria_segurança`](../.cursor/plans/importância_auditoria_segurança_e5733fa0.plan.md) e ao gate em `.cursor/plans/auditoria_supabase_gate.prompt.md`.

---

## A) RLS / Postgres

| Verificação | Status |
|-------------|--------|
| RLS ENABLED em `profiles`, `tasks`, `day_history`, `notification_preferences`, `notifications` | OK |
| Policies SELECT/INSERT/UPDATE/DELETE com `auth.uid()` | OK |
| Sem `USING (true)` em prod | OK |
| UPDATE tem SELECT policy (requisito Postgres RLS) | OK |
| `handle_new_user` SECURITY DEFINER + `search_path = public` | OK |
| EXECUTE revogado em `handle_new_user` e `rls_auto_enable` para anon/authenticated | OK |
| `set_updated_at` com `search_path` fixo | OK |
| Supabase Security Advisor | **0 lints** |

---

## B) Auth / API

| Verificação | Status |
|-------------|--------|
| Auth via Supabase GoTrue (email/senha) | OK |
| Sessão persistida no client; deep link handler Capacitor | OK |
| `user_id` sempre do JWT (`auth.uid()`), nunca confiado do body sem validação | OK |
| Edge Functions expostas | N/A (nenhuma ainda) |
| Service-role no client | **Ausente** (OK) |

---

## C) Segredos e env

| Verificação | Status |
|-------------|--------|
| `.env` no `.gitignore`; `.env.example` versionado | OK |
| Nenhum `.env` no histórico git | OK |
| Client usa só `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | OK |
| Guard dev contra `VITE_*` + service_role | OK |
| PostHog `VITE_POSTHOG_KEY` no bundle | INFO — aceitável (chave de projeto) |
| CI secret scan | OK — `.github/workflows/secret-scan.yml` |

---

## D) Sync e ownership (Fase 11.3)

| Verificação | Status |
|-------------|--------|
| Escrita na nuvem só quando autenticado | OK |
| RLS impede cross-user (IDOR) | OK — validado por design |
| Import local com confirmação explícita | OK |
| Conflito documentado (last-write-wins) | OK — `docs/sync-behavior.md` |

---

## Achados abertos (não bloqueiam gate)

| Severidade | Item | Recomendação |
|------------|------|--------------|
| **~~MEDIUM~~ Resolvido** | PostHog envia `task_title` em eventos | Migrado para `taskAnalyticsProps()` — só `task_id` + categoria/prioridade/duração |
| **LOW** | Push remoto via Edge Functions | Adiado — push nativo continua local por device |
| **LOW** | Realtime não habilitado no client | Pull no reopen é suficiente no MVP |
| **INFO** | JWT expiry 3600s (padrão) | OK para MVP; reduzir se operações sensíveis aumentarem |

---

## Três perguntas rápidas (plano de auditoria)

1. **Segredo indevido no git/bundle?** → Não (PostHog ok; Supabase anon ok).
2. **Backend exposto sem auth?** → PostgREST protegido por RLS; anon sem policies não acessa dados.
3. **Dados de terceiros no servidor sem defesa?** → RLS por `auth.uid()` em todas as tabelas.

---

## Veredito

**Aprovado para uso com sync na nuvem** (pré-loja). Revisitar antes de produção pública se: Edge Functions, Storage, ou push remoto forem adicionados.

Próxima revisão obrigatória: ao adicionar `supabase/functions/` ou Storage buckets.

---

## Re-audit nota 10 (2026-08-22)

Escopo: plano [`plano-seguranca.md`](./plano-seguranca.md) — env boot, guardrails, auth input, deep links, npm audit CI, threat model.

| # | Critério | Status |
|---|----------|--------|
| 1 | Segredos fora do git/bundle privilegiado | ✅ gitleaks + `test:security` |
| 2 | Env validada no boot (Zod) | ✅ `src/lib/env.ts` + `test:env` |
| 3 | RLS + ownership | ✅ mantido |
| 4 | Token auth Keychain nativo | ✅ `secure-auth-storage.ts` |
| 5 | Erros auth sem vazamento | ✅ `mapAuthError` + guardrail |
| 6 | Input usuário validado | ✅ `auth-validation.ts` (senha 8+ cadastro) |
| 7 | Analytics sem PII | ✅ `analytics-task.ts` + guardrail |
| 8 | Storage local íntegro | ✅ PR #38 |
| 9 | Supply chain CI | ✅ `npm audit --production --audit-level=high` |
| 10 | Deep links / recovery | ✅ `parseAuthDeepLinkUrl` + limpeza sessão |
| 11 | Threat model | ✅ [`threat-model-seguranca.md`](./threat-model-seguranca.md) |
| 12 | Guardrail `test:security` | ✅ na suite `npm run test` |

**Gate:** PASS — zero CRITICAL/HIGH em aberto no escopo do app. WARN `delete_own_account` DEFINER permanece aceito em [`security-definer-accept.md`](./security-definer-accept.md).
