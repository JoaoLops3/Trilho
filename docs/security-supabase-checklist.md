# Checklist de segurança — Supabase (Trilho)

Regras obrigatórias antes de merge na `main` e antes de releases com dados na nuvem.

## Chaves e variáveis de ambiente

| Regra                                       | Detalhe                                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Anon key no client                          | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` em `src/lib/supabase.ts`                                    |
| Service role fora do app                    | Somente Edge Functions, CI ou scripts server-side — **nunca** no bundle Capacitor                          |
| Sem prefixo público em chaves privilegiadas | Proibido `VITE_` / `EXPO_PUBLIC_` / `NEXT_PUBLIC_` em service_role, JWT secret ou DB password              |
| `.env` fora do git                          | `.env` e `.env.*` no `.gitignore`; usar `.env.example` como template                                       |
| PostHog no client                           | `VITE_POSTHOG_KEY` é aceitável — chave de projeto para analytics no browser                                |
| CI anti-secreto                             | Workflow `.github/workflows/secret-scan.yml` (gitleaks) no push/PR                                         |
| Supply chain (prod)                         | CI roda `npm audit --production --audit-level=high` — falha em HIGH/CRITICAL nas deps que entram no bundle |

## Exceções de audit (devDependencies)

Audit completo (`npm audit`) pode reportar HIGH em ferramentas de build (Vite, ESLint, Capacitor CLI) que **não** entram no app Capacitor. Revisar trimestralmente com `npm audit fix` quando patches estiverem disponíveis.

| ID / pacote                      | Severidade | Motivo                                                                             | Revisão    |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------------- | ---------- |
| `dompurify` (transitivo PostHog) | moderate   | Sanitizer do PostHog; app não usa DOMPurify diretamente; sem XSS surface no Trilho | 2026-08-22 |

## Row Level Security (RLS)

| Regra                              | Detalhe                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| RLS em todas as tabelas de usuário | `profiles`, `tasks`, `day_history`, `notification_preferences`, `notifications`     |
| Ownership por linha                | Coluna `user_id` (ou `id` em `profiles`) = `auth.uid()`                             |
| Policies completas                 | SELECT, INSERT, UPDATE, DELETE com `auth.uid()`                                     |
| UPDATE exige SELECT                | Postgres RLS: sem policy SELECT, UPDATE retorna 0 rows silenciosamente              |
| Sem policy aberta em prod          | Proibido `USING (true)` / `WITH CHECK (true)` “só pra testar”                       |
| `user_id` do JWT                   | Nunca confiar em `user_id` vindo do body da request sem validar contra `auth.uid()` |
| Não usar `user_metadata` para auth | Metadados editáveis pelo usuário — usar `app_metadata` ou colunas em `profiles`     |

## Funções e triggers

| Regra                         | Detalhe                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `SECURITY DEFINER`            | Sempre `SET search_path = public` (ou schema privado)                                              |
| Triggers only                 | Revogar EXECUTE de funções trigger-only (`handle_new_user`) para anon/authenticated                |
| Sem RPC público desnecessário | Funções expostas via PostgREST devem validar `auth.uid()`                                          |
| `delete_own_account`          | WARN do Advisor **aceito** — ver [`docs/security-definer-accept.md`](./security-definer-accept.md) |

## Edge Functions (quando existirem)

- Verificar sessão / JWT em toda mutação.
- Usar service role apenas dentro da function, nunca expor ao client.
- Não logar tokens ou chaves em produção.

## Sync e migração (Fase 11.3)

- Import one-shot com confirmação do usuário.
- Não sobrescrever dados na nuvem sem aviso.
- RLS deve impedir que um usuário escreva em `user_id` de outro.

## Privacidade / analytics (fora do Postgres, mas relevante)

| Item                                 | Severidade               | Ação                                                                  |
| ------------------------------------ | ------------------------ | --------------------------------------------------------------------- |
| PostHog `task_title` em eventos      | ~~MEDIUM~~ **Resolvido** | Usar `taskAnalyticsProps()` (`task_id` + metadados não-PII)           |
| PostHog `avatar_seed` em eventos     | ~~LOW~~ **Resolvido**    | Removido de `useUpdateAvatar`; só `avatar_style` + `synced_to_cloud`  |
| Sessão Auth em localStorage (nativo) | ~~MEDIUM~~ **Resolvido** | `authStorage` em `src/lib/secure-auth-storage.ts` (Keychain/Keystore) |
| Dados locais em guest                | INFO                     | `localStorage` legível no device — aceitável sem conta                |

## Rate limiting (Auth)

Duas camadas — servidor (GoTrue, por IP) e client (`src/lib/auth-rate-limit.ts`, por operação + e-mail hasheado, janela deslizante em `sessionStorage`):

| Operação          | Limite client         | Limite servidor (config.toml)     |
| ----------------- | --------------------- | --------------------------------- |
| `sign_in`         | 5 / 5 min por e-mail  | 30 sign-in/sign-up / 5 min por IP |
| `sign_up`         | 3 / 15 min por e-mail | idem                              |
| `reset_password`  | 3 / 15 min por e-mail | `email_sent` por hora             |
| `update_password` | 5 / 15 min por sessão | —                                 |

Ao estourar, o client devolve copy PT-BR com cooldown (equivalente do `Retry-After` de um 429) **sem** chamar o Supabase. Login bem-sucedido zera o contador. Guardrail: `npm run test:security` exige `checkAuthRateLimit` nas 4 operações de `auth-context.tsx`.

### Ações manuais no Dashboard (produção)

| Item                       | Onde               | Ação                                                                                                                                                        |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rate limits de produção    | Auth → Rate Limits | Confirmar limites (config.toml só vale para ambiente local)                                                                                                 |
| Senha mínima               | Auth → Passwords   | Alinhar mínimo a **8** (client já exige 8; local está 6)                                                                                                    |
| Leaked Password Protection | Auth → Passwords   | Ativar se o projeto estiver no plano Pro ([docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)) |

### Verificação GitHub (repo `JoaoLops3/Trilho`)

| Item                | Onde                             | Status                                 |
| ------------------- | -------------------------------- | -------------------------------------- |
| Histórico sem leaks | gitleaks local (117 commits)     | ok — 0 leaks (2026-08-24)              |
| Secret scanning     | Settings → Code security         | Confirmar habilitado + revisar alertas |
| Push Protection     | Settings → Code security         | Ativar para bloquear push com secret   |
| CI secret-scan      | Actions → workflow `Secret scan` | Confirmar verde na `main`              |

## Validação de input no Postgres

| Campo                         | Constraint                    | Espelha front                                                     |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| `profiles.display_name`       | 2–50 chars                    | `validateDisplayName()`                                           |
| `profiles.nickname`           | null ou 2–20 chars            | `PROFILE_HEADER_NAME_MAX_LENGTH`                                  |
| `profiles.daily_goal_minutes` | 15–720                        | presets em `daily-goal.ts`                                        |
| `tasks.title`                 | 1–120 chars                   | `NewTaskSheet`                                                    |
| `tasks.category`              | enum fixo                     | categorias do app                                                 |
| Senha (Auth)                  | `minimum_password_length = 6` | `validateSignupPassword()` — **8+** no client (cadastro/recovery) |

Migration: `supabase/migrations/20260715140000_harden_input_checks.sql`

## App Store readiness (checklist consolidado)

### Já OK

| Item                                                            | Status                                                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Anon key only no client                                         | ok                                                                                  |
| `.env` fora do git                                              | ok                                                                                  |
| HTTPS em produção (Supabase, PostHog, DiceBear)                 | ok                                                                                  |
| RLS em 5 tabelas + policies CRUD own-user                       | ok                                                                                  |
| Sem policy `USING (true)`                                       | ok                                                                                  |
| Exclusão de conta (`delete_own_account` + CASCADE + wipe local) | ok — aceite DEFINER em [`security-definer-accept.md`](./security-definer-accept.md) |
| Sem Edge Functions                                              | ok                                                                                  |
| PostHog sem título de tarefa / notas                            | ok                                                                                  |
| PostHog nativo: sem session recording / autocapture             | ok                                                                                  |

### Resolvido neste PR

| Item                                      | Status                                     |
| ----------------------------------------- | ------------------------------------------ |
| JWT em secure storage (Keychain/Keystore) | ok — `@aparajita/capacitor-secure-storage` |
| CHECK constraints no Postgres             | ok — migration `harden_input_checks`       |
| PostHog sem `avatar_seed`                 | ok                                         |

### Manual antes da submissão (App Store Connect / Dashboard)

| Item                                            | Prioridade   | Ação                                                                                                                   |
| ----------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Privacy Nutrition Labels                        | **Crítico**  | Ver checklist detalhado abaixo (App Store Connect).                                                                    |
| Zoom / viewport (a11y)                          | ok no código | `index.html` sem `user-scalable=no` / `maximum-scale=1` — pinch-to-zoom liberado (branch `chore/app-store-checklist`). |
| `npx cap sync ios` após instalar secure-storage | Importante   | Rodar após merge para linkar plugin nativo                                                                             |

#### Privacy Nutrition Labels (App Store Connect)

Em **App Privacy** do app, declarar o que o Trilho coleta:

| Fonte                              | Tipos típicos                                                  | Linked to User | Tracking                           |
| ---------------------------------- | -------------------------------------------------------------- | -------------- | ---------------------------------- |
| **PostHog** (só com consentimento) | Product Interaction, Device ID, Diagnostics / Performance      | Yes            | No (sem ads; analytics de produto) |
| **Supabase** (auth + sync)         | Contact Info (e-mail), User Content (tarefas, perfil, rotinas) | Yes            | No                                 |

Notas:

- PostHog fica **off** até o usuário conceder consentimento (`AnalyticsConsentSheet`).
- Não declarar dados que o app não coleta (localização, contatos da agenda, etc.).
- Revisar o texto da tela **Política de privacidade** e `public/privacidade.html` se a declaração mudar.

## Gate de auditoria

Rodar após cada PR que altera `supabase/migrations/`, `src/lib/supabase.ts` ou sync:

- Prompt: `.cursor/plans/auditoria_supabase_gate.prompt.md`
- Relatório: `docs/security-audit-fase-11-complete.md`
- Threat model: [`docs/threat-model-seguranca.md`](./threat-model-seguranca.md)
- Plano nota 10: [`docs/plano-seguranca.md`](./plano-seguranca.md)
- Bloqueio: zero achados **CRITICAL** / **HIGH** em aberto

## Referências

- [`docs/supabase.md`](./supabase.md) — arquitetura e setup
- [`docs/sync-behavior.md`](./sync-behavior.md) — offline e conflitos
- [`docs/security-definer-accept.md`](./security-definer-accept.md) — aceite do WARN em `delete_own_account`
