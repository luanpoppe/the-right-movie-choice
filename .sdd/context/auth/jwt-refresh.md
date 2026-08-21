# JWT e refresh
> Atualizado em 2026-08-21 · fontes: `AuthSessionFacade`, `LoginUseCase`, `RefreshAccessTokenUseCase`, `RefreshTokenCookie`, `auth.controller`

## O que é
Sessão nativa (e também pós-Google): access JWT curto no JSON e refresh opaco em cookie httpOnly, persistido no Redis.

## Como funciona
- Rotas: `POST /auth/login`, `/auth/refresh`, `/auth/logout` (`authControllers`).
- `LoginUseCase` valida e-mail/senha via `IUserCredentialsRepository` + bcrypt e chama `AuthSessionFacade.issue`.
- Facade gera UUID de refresh, salva em `IRefreshTokenRepository`, assina access (`IAccessTokenProvider`).
- Cookie: `RefreshTokenCookie` (`httpOnly`, `sameSite: lax`, `secure` só em `prod`). Nome/TTL vêm do env (`REFRESH_COOKIE_NAME`, `REFRESH_TOKEN_TTL_SECONDS`).
- Refresh rotaciona: apaga o token antigo, emite outro UUID + novo access (`RefreshAccessTokenUseCase`). Logout revoga e limpa cookie.

## Decisões e porquês
- Access no body / refresh em cookie — XSS não lê o refresh; o SPA guarda o access em `sessionStorage` (`AuthContext`).
- Rotação a cada refresh — token roubado perde valor no próximo uso.
- Facade única — login nativo e Google emitem a mesma forma de sessão.

## Notas
Não há middleware Bearer nas rotas de filme. CORS exige `credentials: true`. Frontend usa `authClient` com `withCredentials`.
