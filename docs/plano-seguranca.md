# Plano — Segurança nota 10/10 (zero custo)

Meta: elevar **Segurança OWASP + Supabase** de **8.5 → 10** só com código, testes, CI e docs — **sem** App Store Connect, **sem** upgrade pago Supabase, **sem** serviços pagos.

Escopo ativo alinhado ao canvas: melhorar o app no repositório; publicação fica gate futuro.

**Baseline (main):** PR #34 RLS initplan, PR #33 logout wipe, PR #36 observabilidade, PR #37 Vitest+CI, PR #38 storage Zod, gitleaks, Keychain nativo, anon-only no client.

---

## O que é “nota 10” aqui

Nota 10 **não** significa “impossível de hackear”. Significa: **defesa em profundidade verificável** — cada camada tem implementação + teste/guardrail + doc.

| # | Critério | Hoje (~8.5) | Nota 10 = |
|---|----------|-------------|-----------|
| 1 | Segredos fora do git/bundle privilegiado | ✅ | ✅ + validação automática |
| 2 | Env validada no boot | ❌ cast solto | ✅ Zod fail-fast |
| 3 | RLS + ownership | ✅ | ✅ + guardrail expandido |
| 4 | Token auth no nativo | ✅ Keychain | ✅ + teste/guardrail |
| 5 | Erros auth sem vazamento | ✅ | ✅ + guardrail |
| 6 | Input do usuário sanitizado/validado | ⚠️ parcial | ✅ todos os fluxos críticos |
| 7 | Analytics sem PII | ✅ | ✅ + guardrail estático |
| 8 | Storage local íntegro | ✅ PR #38 | ✅ mantido |
| 9 | Dependências (supply chain) | ❌ sem CI | ✅ `npm audit` na CI |
| 10 | Deep links / recovery auth | ⚠️ básico | ✅ validação explícita |
| 11 | Threat model documentado | ⚠️ checklist | ✅ doc + critérios de regressão |
| 12 | Guardrail `test:security` | ❌ | ✅ na suite `npm run test` |

**DoD global:** `npm run test` verde, canvas skill Segurança = **10**, advisors Supabase 0 ERROR (WARN DEFINER aceito documentado).

---

## Ordem de execução (uma branch por vez)

```
main
 └── fix/env-validation-boot          ← Fase 1
      └── fix/security-guardrails       ← Fase 2 (base do 10)
           └── fix/auth-input-hardening ← Fase 3
                └── fix/deep-link-auth-guard ← Fase 4
                     └── chore/ci-npm-audit ← Fase 5
                          └── docs/threat-model-seguranca ← Fase 6
                               └── (opcional) fix/capacitor-navigation-allowlist ← Fase 7
```

Merge cada PR na `main` antes de abrir a próxima.

---

## Fase 1 — `fix/env-validation-boot`

**Objetivo:** falhar cedo se `.env` estiver errado; nunca subir build com URL/key inválida.

### Tarefas

- [ ] Criar `src/lib/env.ts` com Zod:
  - `VITE_SUPABASE_URL` — URL `https://*.supabase.co` (opcional: se ausente, app offline-only)
  - `VITE_SUPABASE_ANON_KEY` — string não vazia quando URL presente
  - `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` — opcionais
  - `VITE_APP_URL` — opcional, URL válida
  - Regra: se URL Supabase existe, anon key obrigatória (e vice-versa)
- [ ] Chamar `parseEnv()` no boot (`main.tsx` ou `App.tsx`) — em **DEV** log claro; em **PROD** não logar valores
- [ ] Refatorar `supabase.ts` e `posthog.ts` para ler de `env.ts` export tipado
- [ ] Vitest: `src/lib/env.test.ts` — casos válido, parcial, URL inválida, par URL/key inconsistente
- [ ] Guardrail estático em `scripts/validate-env.mjs`:
  - existe `src/lib/env.ts` + schema Zod
  - `main.tsx` ou `App.tsx` importa validação no boot
- [ ] Adicionar `test:env` ao `package.json` e encadear em `npm run test`

### Verificação

```bash
npm run test:env
npm run test:unit
npm run build
```

### DoD

- Build quebra ou degrada graciosamente (offline-only) quando env Supabase incompleta — comportamento documentado no README.

---

## Fase 2 — `fix/security-guardrails`

**Objetivo:** nota 10 sustentável — regressão vira falha de CI, não revisão manual.

### Tarefas

- [ ] Criar `scripts/validate-security.mjs` (node --test) verificando:
  - [ ] Nenhum `service_role` / `SUPABASE_SERVICE_ROLE` em `src/`
  - [ ] Nenhum `dangerouslySetInnerHTML` / `.innerHTML` em `src/`
  - [ ] `src/lib/supabase.ts` — só anon + `warnPrivilegedViteEnv`
  - [ ] `src/lib/auth-errors.ts` — `GENERIC_AUTH_ERROR` + `mapAuthError` sem retornar `error.message` cru
  - [ ] `src/lib/secure-auth-storage.ts` — Keychain no nativo
  - [ ] `src/lib/analytics-task.ts` — sem `task.title` / PII
  - [ ] `posthog.ts` — init só após consentimento (`getAnalyticsConsent`)
  - [ ] `.gitignore` contém `.env` e `.env.*`
  - [ ] Workflow `secret-scan.yml` existe
  - [ ] `observability.ts` — surface `storage` (pós PR #38)
- [ ] Adicionar `test:security` ao `package.json` → `npm run test`
- [ ] Atualizar `scripts/validate-ci.mjs` se quiser exigir `test:security` explicitamente (opcional)

### Verificação

```bash
npm run test:security
npm run test
```

### DoD

- Qualquer reintrodução de `innerHTML` ou service_role no client falha o CI.

---

## Fase 3 — `fix/auth-input-hardening`

**Objetivo:** validação client-side alinhada a OWASP — menos superfície antes do GoTrue.

### Tarefas

- [ ] Criar `src/lib/auth-validation.ts`:
  - e-mail: trim + regex razoável + max length
  - senha cadastro/recovery: **mínimo 8 caracteres** (subir de 6; atualizar copy em `auth-errors.ts`)
  - nickname/display: reutilizar limites de `profile-storage` / migration CHECK
- [ ] Usar em: login, signup, forgot password, new password, edit nickname (onde aplicável)
- [ ] Vitest: `auth-validation.test.ts` — borda vazia, curta, e-mail inválido, unicode
- [ ] Guardrail: `validate-security.mjs` checa que telas auth importam validação (grep LoginScreen, SignUp, etc.)

### Verificação

```bash
npm run test:unit
# manual: tentar signup com senha 6 chars → bloqueado no client
```

### DoD

- Nenhuma tela auth envia senha &lt; 8 chars sem feedback visual (loading/error states existentes).

---

## Fase 4 — `fix/deep-link-auth-guard`

**Objetivo:** recovery e magic links não deixam tokens inválidos pendurados.

### Tarefas

- [ ] Auditar `App.tsx` / `@capacitor/app` listener de URL auth
- [ ] Validar formato do hash/query antes de `setSession` (rejeitar URLs malformadas)
- [ ] Em falha de recovery: limpar tokens (`signOut` local + storage) — alinhar com `NewPasswordScreen`
- [ ] Vitest ou teste de módulo puro para parser de URL auth (sem Capacitor real)
- [ ] Documentar fluxo em `docs/supabase-auth-production.md` (seção “deep link inválido”)

### Verificação

```bash
npm run test
# manual simulador: abrir link recovery expirado → mensagem PT + limpeza
```

### DoD

- Link inválido/expirado nunca deixa sessão “meio autenticada”.

---

## Fase 5 — `chore/ci-npm-audit`

**Objetivo:** supply chain — falhar CI em vulnerabilidades HIGH/CRITICAL conhecidas (grátis).

### Tarefas

- [ ] Adicionar job ou step em `.github/workflows/ci.yml`:
  ```bash
  npm audit --audit-level=high
  ```
- [ ] Se falso positivo inevitável: documentar exceção em `docs/security-supabase-checklist.md` com ID CVE + motivo + data revisão (máx. 3 exceções)
- [ ] Guardrail `validate-ci.mjs` confirma que audit roda na CI

### Verificação

- PR de teste na CI deve rodar audit

### DoD

- CI vermelha se `npm audit` reportar HIGH+ não documentado.

---

## Fase 6 — `docs/threat-model-seguranca`

**Objetivo:** nota 10 exige doc de regressão — o “porquê” sobrevive a você.

### Tarefas

- [ ] Criar `docs/threat-model-seguranca.md`:
  - Ativos (tarefas, perfil, JWT, histórico)
  - Atores (usuário, anon com key, atacante com device)
  - Trust boundaries (client ↔ Supabase ↔ PostHog)
  - Ameaças STRIDE resumidas + mitigação atual
  - O que **não** está no escopo (ASC, Supabase pago, pentest externo)
- [ ] Atualizar `docs/security-supabase-checklist.md` — link para threat model
- [ ] Atualizar `docs/security-audit-fase-11-complete.md` — seção “Re-audit nota 10” com data e checklist 12 critérios acima
- [ ] Canvas: skill Segurança → **10** após merge da Fase 2+6 mínimo

### DoD

- Qualquer dev novo entende em 10 min o que protege o quê.

---

## Fase 7 (opcional) — `fix/capacitor-navigation-allowlist`

**Objetivo:** WebView não navega para domínios arbitrários.

### Tarefas

- [ ] Revisar `capacitor.config.ts` — `server.allowNavigation` / plugins
- [ ] Allowlist: `*.supabase.co`, PostHog host, DiceBear (avatar), domínio app
- [ ] Bloquear `allowMixedContent` (já false no Android)
- [ ] Doc curta no threat model

### DoD

- Link externo malicioso dentro do app não abre WebView sem confirmação (ou é bloqueado).

---

## Checklist rápido pós-plano (você executa uma vez)

Antes de declarar nota 10 no canvas:

```bash
git checkout main && git pull
npm ci
npm run test          # deve incluir test:security + test:env
npm run typecheck
npm run build
```

Manual (15 min, simulador):

- [ ] Login → logout → login conta B (wipe ok)
- [ ] Recovery link inválido (Fase 4)
- [ ] App funciona sem `.env` Supabase (offline-only)
- [ ] PostHog off até consentimento

Supabase Dashboard (free):

- [ ] Security Advisor: 0 ERROR
- [ ] RLS enabled em todas as tabelas user (já ok)

---

## O que NÃO entra neste plano (de propósito)

| Item | Motivo |
|------|--------|
| Nutrition Labels / ASC | Gate futuro — fora do escopo ativo |
| Supabase Pro / HaveIBeenPwned | Pago — removido do checklist |
| Pentest contratado | Custo |
| WAF / rate limit próprio | Infra paga ou Edge Functions (futuro) |
| Certificate pinning | Complexidade alta; ROI baixo no MVP |

---

## Estimativa

| Fase | Esforço | Impacto na nota |
|------|---------|-----------------|
| 1 env boot | ~2h | +0.3 |
| 2 guardrails | ~2h | +0.5 (sustentação) |
| 3 auth input | ~2h | +0.3 |
| 4 deep link | ~2h | +0.2 |
| 5 npm audit CI | ~1h | +0.2 |
| 6 threat model | ~1h | +0.2 (doc + critério 11) |
| 7 capacitor (opt) | ~1h | +0.1 |

**Total ~9–11h** para fechar critérios 1–12 e marcar **10/10** no canvas.

---

## Referências no repo

- [`docs/security-supabase-checklist.md`](./security-supabase-checklist.md)
- [`docs/security-definer-accept.md`](./security-definer-accept.md)
- [`docs/security-audit-fase-11-complete.md`](./security-audit-fase-11-complete.md)
- [`docs/sync-behavior.md`](./sync-behavior.md) — logout wipe
- [`.github/workflows/secret-scan.yml`](../.github/workflows/secret-scan.yml)
- [`src/lib/supabase.ts`](../src/lib/supabase.ts)
- [`src/lib/secure-auth-storage.ts`](../src/lib/secure-auth-storage.ts)

---

## Primeiro comando quando for executar

```bash
git checkout main && git pull
git checkout -b fix/env-validation-boot
# seguir Fase 1 acima
```
