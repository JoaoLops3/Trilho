# Supabase — pasta do CLI

Migrations versionadas do schema Postgres. Ver documentação completa em [`docs/supabase.md`](../docs/supabase.md).

## Comandos rápidos

```bash
supabase link --project-ref qellobflykthabmauicb
supabase db push
supabase db reset    # local + Docker
```

## Migrations

Timestamps alinhados ao histórico do projeto remoto (`schema_migrations`).

1. `20260627173457_initial_schema.sql` — schema + RLS + revokes em `handle_new_user`
2. `20260627173903_harden_function_security.sql` — `search_path` em `set_updated_at`, revokes em `handle_new_user`
3. `20260627173929_revoke_rls_auto_enable_rpc.sql` — revoke EXECUTE em `rls_auto_enable`
4. `20260627183639_delete_own_account.sql` — exclusão de conta (LGPD)
5. `20260627203026_signup_display_name.sql` — `display_name` no signup
6. `20260628022742_profile_nickname.sql` — coluna `nickname` editável no app
7. `20260822142153_rls_initplan.sql` — RLS initplan: `(select auth.uid())` nas 24 policies (version alinhada ao remoto via MCP)
