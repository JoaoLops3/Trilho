# Auth — URLs de produção (Supabase Dashboard)

Configure em **[Supabase Dashboard](https://supabase.com/dashboard/project/qellobflykthabmauicb/auth/url-configuration)** → **Authentication** → **URL Configuration**.

## Site URL

URL principal do app em produção:

```
https://SEU-DOMINIO.com
```

Se ainda não tiver domínio web, use a URL do deploy (ex. Vercel preview ou página de landing) até publicar o PWA/Capacitor com Universal Links.

Para **dev local**, o CLI usa `http://localhost:5173` (`supabase/config.toml`).

## Redirect URLs (adicione todas)

Copie e cole no campo **Redirect URLs** (uma por linha):

```
http://localhost:5173/login
http://127.0.0.1:5173/login
http://localhost:5173/cadastro
http://127.0.0.1:5173/cadastro
http://localhost:5173/recuperar-senha
http://localhost:5173/nova-senha
https://SEU-DOMINIO.com/login
https://SEU-DOMINIO.com/cadastro
https://SEU-DOMINIO.com/recuperar-senha
https://SEU-DOMINIO.com/nova-senha
capacitor://localhost/login
capacitor://localhost/nova-senha
https://localhost/login
https://localhost/nova-senha
```

Substitua `SEU-DOMINIO.com` pelo domínio real quando publicar.

**Importante (iOS):** o e-mail de recuperação deve abrir **`/nova-senha`**, não o login. O app usa `getAuthRedirectPath("/nova-senha")` em `resetPasswordForEmail`.

## Variável no app

No `.env` de produção:

```bash
VITE_APP_URL=https://SEU-DOMINIO.com
```

Usada em:
- confirmação de e-mail (`signUp`)
- recuperação de senha (`resetPasswordForEmail` → `/nova-senha`)

Sem essa variável, o app usa `window.location.origin` (ok em dev).

## Capacitor (iOS)

O app id é `com.joaolops3.trilho`. Para deep links de auth no nativo:

1. Configure **Universal Links** (iOS) apontando para `https://SEU-DOMINIO.com/*` (Associated Domains)
2. Mantenha `capacitor://localhost/nova-senha` como fallback de dev
3. `App.tsx` escuta `appUrlOpen` → `handleAuthDeepLink` (exchange code / setSession)
4. `AuthGate` redireciona para `/nova-senha` quando `PASSWORD_RECOVERY` ou flag de recovery
5. Tokens no hash/query são limpos na web após a sessão (`clearAuthParamsFromUrl`)

## Fluxo de recuperação (critério iOS)

1. Usuário em **Recuperar senha** → recebe e-mail
2. Toca o link no Mail → abre o app (Universal Link / scheme)
3. App autentica a sessão de recovery → tela **Nova senha**
4. Usuário define senha (`updateUser`) → entra no app
5. Consegue fazer login de novo com a senha nova

## Checklist pré-loja

- [ ] Site URL = domínio de produção
- [ ] Redirect URLs incluem `/login`, `/cadastro`, `/recuperar-senha`, `/nova-senha`
- [ ] `VITE_APP_URL` no build de produção iOS
- [ ] Universal Links configurados no Xcode
- [ ] Testar no **device**: cadastro → e-mail → confirmar → login
- [ ] Testar no **device**: esqueci senha → Mail → app → nova senha → login

## Deep link inválido ou expirado

O app valida o formato do link **antes** de chamar `setSession` / `exchangeCodeForSession` (`parseAuthDeepLinkUrl` em `src/lib/auth-deeplink.ts`).

Comportamento:

1. URL malformada, tokens curtos ou par `access_token`/`refresh_token` incompleto → **rejeitado no client**.
2. Troca de sessão falha (link expirado, OTP usado) → `invalidateAuthAfterFailedDeepLink()`:
   - remove flag de recovery;
   - `signOut({ scope: "local" })` — evita sessão “meio autenticada”;
   - limpa hash/query na web (`clearAuthParamsFromUrl`).
3. Usuário vê a tela **Link inválido ou expirado** em `/nova-senha` e pode solicitar novo e-mail.

Teste manual: abrir link de recovery já usado no simulador → mensagem em PT + sem sessão pendurada.
