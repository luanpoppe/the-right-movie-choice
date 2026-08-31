# Refresh silencioso no SPA
> Atualizado em 2026-08-30 · fontes: `movie-client.ts`, `movie-silent-refresh.ts`, `AuthContext`, `MovieRecommendationService`

## O que é
O POST de recommendation no browser manda cookie (`guest-id` + refresh) e, se houver access, o Bearer. Access expirado dispara `POST /auth/refresh` uma vez, grava o JWT novo no `sessionStorage` e retenta o POST. Anônimo não chama refresh. Falha de sessão limpa o token, tenta logout e manda para `/login`.

## Como funciona
- `movieClient` (axios separado do `authClient`): `withCredentials`, interceptor de request (`AccessTokenStorage` + `StringUtils.isEmptyString`), interceptor de 401 (`MovieSilentRefresh`).
- Refresh usa `AuthService.refresh` no `authClient` (evita loop). Single-flight + um retry (`_silentRefreshRetry`).
- `AuthProvider` registra `MovieSilentRefresh.setOnSessionExpired` com `useNavigate`.
- `MovieRecommendationService.getRecommendations` usa `movieClient.post` e o header `chatId`.

## Decisões e porquês
- Access no `sessionStorage` (`authToken`) — spec desta mudança; refresh continua httpOnly.
- Interceptor só no client de movies — `/auth/refresh` não passa pelo mesmo 401 handler.
- Refresh OK não atualiza React — só o storage; o interceptor lê o storage no próximo request.
- `authClient` sem o interceptor de movies.

## Notas
Cota 401 com token ainda no storage tenta refresh; segunda 401 cai no handler de sessão. Lock do chat anônimo ainda não existe (próxima feature).
