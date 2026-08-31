# Spec: Refresh silencioso no SPA

> Parte de [`movie-auth-and-refresh`](../../plan.md)

## Resumo

O client HTTP das rotas de filme anexa o Bearer do `sessionStorage`, envia cookies (`guest-id` e refresh) e, se o access expirou (401 **com** token salvo), chama `POST /auth/refresh` uma vez, grava o novo access e retenta o POST original. Anônimo não dispara refresh.

## Requirements (cenários BDD)

### REQ-1: Bearer no POST de recommendation

- **Dado que** existe `authToken` em `sessionStorage` (`AuthTokensEnum.AUTH_TOKEN`)
- **Quando** o SPA chama `POST /movie/recommendation`
- **Então** o client de movies envia `Authorization: Bearer <token>` e `withCredentials: true` (cookie `guest-id` e o de refresh)

### REQ-2: Access expirado renova e retenta

- **Dado que** o usuário está logado (há token) e o access expirou
- **Quando** o POST de filme devolve 401
- **Então** o interceptor chama `AuthService.refresh()` (`authClient` + cookie), salva o novo access só no `sessionStorage` e **repete uma vez** o POST original com o Bearer novo

### REQ-3: Anônimo não refresha

- **Dado que** não há `authToken` no `sessionStorage`
- **Quando** o POST devolve 401 (cota ou JWT)
- **Então** não chama `/auth/refresh`; o erro sobe para a UI (lock na próxima feature)

### REQ-4: Refresh falhou

- **Dado que** o refresh retorna erro (cookie inválido)
- **Quando** o interceptor trata essa falha
- **Então** limpa o access, chama `AuthService.logout()` se possível e navega para `/login` via react-router (ponte no `AuthContext`)

## Edge cases

- Vários 401 ao mesmo tempo → um único refresh (single-flight); as outras requests esperam e retentam com o token novo.
- Segunda 401 na retentativa → não entra em loop; trata como refresh falhou (REQ-4).
- Interceptor só no client de movies; `authClient` não ganha o mesmo interceptor (evita loop em `/auth/refresh`).
- `GET /movie/queries` pode continuar no axios atual sem Bearer (rota pública).
- Cota 401 com token ainda no storage (caso raro) → o interceptor tenta refresh; se o access era válido, o retry ainda leva 401 de cota e para na 2ª tentativa.

## Contratos

- `packages/frontend/src/features/movies/services/movie-recommendation.service.ts` passa a usar um axios de movies (`withCredentials`, header `chatId`, Bearer opcional).
- Refresh: `AuthService.refresh` → `POST /auth/refresh` já existente (`auth-client.ts`).
- Token: chave `authToken` (`AuthTokensEnum`); não atualizar React state no interceptor — só `sessionStorage`.
- Navegação pós-falha: `navigate('/login')` via callback registrado no `AuthContext`.
- Fora: timer por `expiresIn`; interceptor no `authClient`; lock do chat.
