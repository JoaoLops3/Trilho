# Threat model — Trilho (Capacitor + Supabase)

Documento de regressão para segurança **nota 10** — o que protegemos, de quem, e como verificar que não regrediu.

**Última revisão:** 2026-08-22  
**Plano de execução:** [`plano-seguranca.md`](./plano-seguranca.md)

---

## Ativos

| Ativo | Onde vive | Sensibilidade |
|-------|-----------|---------------|
| Tarefas, rotinas, histórico | `localStorage` (guest) + Postgres (conta) | Alta — conteúdo pessoal |
| Perfil (nome, avatar, meta) | Idem | Média |
| JWT / refresh token | Keychain/Keystore (nativo), localStorage (web dev) | Crítica |
| Chave anon Supabase | Bundle `VITE_*` | Baixa (pública by design) |
| Consentimento analytics | `localStorage` | Baixa |
| Eventos PostHog | Servidor PostHog (com consentimento) | Média — sem PII de tarefa |

---

## Atores

| Ator | Capacidade | Objetivo típico |
|------|------------|-----------------|
| Usuário legítimo | App instalado, conta própria | Usar rotina |
| Anon com anon key | PostgREST + Auth API públicas | Ler/escrever **só** dados próprios (RLS) |
| Atacante com device físico | Ler storage não criptografado (guest) | Extrair tarefas locais |
| Atacante remoto | Phishing, link malicioso, XSS | Roubar sessão ou injetar UI |

---

## Trust boundaries

```
┌─────────────────────────────────────────────────────────┐
│  Client Capacitor (WebView + plugins nativos)             │
│  - Validação env (Zod)                                    │
│  - Auth input (8+ cadastro)                             │
│  - Storage local Zod                                      │
│  - Keychain JWT (nativo)                                  │
└───────────────┬─────────────────────┬───────────────────┘
                │ HTTPS               │ HTTPS (consent)
                ▼                     ▼
        ┌───────────────┐     ┌──────────────┐
        │ Supabase      │     │ PostHog      │
        │ GoTrue + RLS  │     │ Analytics    │
        └───────────────┘     └──────────────┘
```

**Regra:** o client **nunca** confia em `user_id` do body — ownership vem de `auth.uid()` no Postgres.

---

## STRIDE (resumo)

| Categoria | Ameaça | Mitigação atual |
|-----------|--------|-----------------|
| **S** Spoofing | Login com credencial alheia | GoTrue + RLS; JWT em Keychain nativo |
| **T** Tampering | Escrever tarefa de outro user | RLS `user_id = auth.uid()` |
| **R** Repudiation | Negar ação | Fora do escopo MVP (sem audit log app) |
| **I** Info disclosure | Vazar `error.message` auth | `mapAuthError` → copy PT genérica |
| **I** Info disclosure | PII em PostHog | `taskAnalyticsProps` sem título |
| **D** DoS | Abuse Auth API | Rate limit GoTrue; client valida input |
| **E** Elevation | service_role no bundle | Guardrail `test:security`; só anon no client |

---

## Controles verificáveis (CI)

| Controle | Como verificar |
|----------|----------------|
| Env boot | `npm run test:env` |
| Guardrails segurança | `npm run test:security` |
| Storage Zod | `npm run test:storage` |
| Logout wipe | `npm run test:auth` |
| RLS initplan | `npm run test:rls` |
| Secrets no git | `.github/workflows/secret-scan.yml` |
| Deps prod HIGH+ | CI `npm audit --production --audit-level=high` |
| Deep link inválido | `auth-deeplink.test.ts` + doc em `supabase-auth-production.md` |

---

## Fora de escopo (deliberado)

- App Store Connect / Nutrition Labels (gate futuro)
- Supabase Pro / HaveIBeenPwned (pago)
- Pentest externo contratado
- WAF / rate limit próprio na borda
- Certificate pinning
- Edge Functions (ainda não existem)

---

## Regressão — o que quebra a nota 10

1. `service_role` ou `innerHTML` em `src/` → `test:security` falha
2. `import.meta.env.VITE_SUPABASE_*` fora de `env.ts` → `test:env` falha
3. PostHog init sem consentimento → `test:security` falha
4. JWT nativo volta para localStorage sem Keychain → guardrail manual + checklist
5. CI verde sem `npm audit` prod → `test:ci` falha

## WebView — allowlist de navegação

`capacitor.config.ts` → `server.allowNavigation` restringe domínios externos no WebView nativo:

- `*.supabase.co` — Auth/API
- PostHog (`us.i.posthog.com`, `eu.i.posthog.com`, `app.posthog.com`)
- `api.dicebear.com` — avatares

Links fora da lista não abrem navegação in-app silenciosa; preferir `Browser.open` com confirmação quando adicionar links externos na UI.

---

## Referências

- [`security-supabase-checklist.md`](./security-supabase-checklist.md)
- [`security-audit-fase-11-complete.md`](./security-audit-fase-11-complete.md)
- [`sync-behavior.md`](./sync-behavior.md)
- [`supabase-auth-production.md`](./supabase-auth-production.md)
