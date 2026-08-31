# Login e register
> Atualizado em 2026-08-30 · fontes: `LoginPage`, `RegisterPage`, `AuthService`, `AuthContext`, `auth-client.ts`

## O que é
Telas `/login` e `/register` para conta com senha ou Google. A sessão no SPA é o access token; o refresh fica no cookie do browser.

## Como funciona
- Router: `routes/index.tsx` sob `Root` (`GoogleOAuthProvider` + `AuthProvider`).
- `AuthService` usa `authClient` (axios `withCredentials`) contra `/auth/*` e `/users/register`.
- `AuthContext` persiste access via `AccessTokenStorage` (`authToken`). `clearSession` limpa o access local. Sessão expirada no `movieClient` chama `MovieSilentRefresh.setOnSessionExpired` → logout (best-effort) + `navigate('/login')`.
- Google: `GoogleSignInButton` envia o credential para `/auth/google`.
- Erros HTTP mapeados em `auth-error.util.ts`.

## Decisões e porquês
- `sessionStorage` para o JWT — some ao fechar a aba; refresh cookie cobre a renovação enquanto o browser existir (TTL 7d default).
- Dois axios: `authClient` (login/refresh/logout) e `movieClient` (recommendation + silent refresh). Cookies de credentials nos dois.
- Sem guard de rota ainda — login não bloqueia o chat.

## Notas
`VITE_BACKEND_URL` e `VITE_GOOGLE_CLIENT_ID` em `utils/env.ts`.
