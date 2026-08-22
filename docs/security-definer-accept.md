# Aceite — `public.delete_own_account()` SECURITY DEFINER

| Campo | Valor |
|-------|-------|
| Data | 2026-08-21 |
| Projeto | `qellobflykthabmauicb` (Trilho) |
| Advisor | `authenticated_security_definer_function_executable` (WARN) |
| Migration | `supabase/migrations/20260627183639_delete_own_account.sql` |
| Decisão | **Aceito** — mantém SECURITY DEFINER + EXECUTE para `authenticated` |

## O que o Advisor aponta

O Security Advisor do Supabase alerta funções `SECURITY DEFINER` executáveis pelo role `authenticated` via PostgREST (`/rest/v1/rpc/delete_own_account`). O risco genérico é privilege escalation: o caller roda com os privilégios do dono da função, não com os seus.

## Por que DEFINER é necessário

Exclusão de conta (LGPD / App Store) exige apagar a linha em `auth.users`. O role `authenticated` **não** tem permissão de `DELETE` em `auth.users` sob `SECURITY INVOKER`. Sem DEFINER (ou sem service role no client — proibido), o self-service de exclusão não funciona.

Dados em `public.*` (`profiles`, `tasks`, `day_history`, `notification_preferences`, `notifications`, `routine_templates`) referenciam `auth.users(id) ON DELETE CASCADE`. Apagar o próprio usuário na Auth limpa o restante.

## Controles que tornam o aceite aceitável

| Controle | Detalhe |
|----------|---------|
| Escopo só do próprio usuário | `uid := auth.uid()`; se `null`, exception `Not authenticated`; `DELETE FROM auth.users WHERE id = uid` — nunca aceita UUID do body |
| `search_path` fixo | `SET search_path = public, auth` — mitiga hijack de schema |
| EXECUTE restrito | `REVOKE` de `PUBLIC` e `anon`; `GRANT EXECUTE` só a `authenticated` |
| Sem parâmetros | Assinatura `delete_own_account()` — não há vetor de “apagar outro id” via argumento |
| Client | `AuthProvider.deleteAccount` → RPC → `clearAllLocalAppData()` → `signOut()`; UI com confirmação (`ConfirmDeleteAccountSheet`) |
| Sem service role no app | Bundle Capacitor só usa anon key |

## O que o WARN **não** significa neste caso

- Não é policy RLS aberta.
- Não permite que usuário A apague usuário B (o `WHERE id = auth.uid()` impede).
- Não substitui autenticação: sem JWT válido a função aborta.

## Alternativas consideradas e rejeitadas

| Alternativa | Por que não |
|-------------|-------------|
| `SECURITY INVOKER` | `authenticated` não deleta em `auth.users` |
| Edge Function + service role | Complexidade extra; mesmo privilégio elevado, só mudando de superfície |
| Revogar EXECUTE e apagar só no Dashboard | Quebra self-service LGPD / requisito de exclusão na loja |

## Decisão formal

Mantemos `public.delete_own_account()` como `SECURITY DEFINER` com EXECUTE para `authenticated`. O WARN do Advisor permanece **esperado** e **não bloqueia** release enquanto os controles acima existirem.

Qualquer mudança na função (parâmetros, remoção do check `auth.uid()`, grant a `anon`, alteração de `search_path`) **invalida este aceite** e exige nova revisão.

## Referências

- Migration: [`supabase/migrations/20260627183639_delete_own_account.sql`](../supabase/migrations/20260627183639_delete_own_account.sql)
- Client: `src/lib/auth-context.tsx` (`deleteAccount`)
- Checklist: [`docs/security-supabase-checklist.md`](./security-supabase-checklist.md)
- Lint: [authenticated_security_definer_function_executable](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
