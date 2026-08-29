# Cota anônima e Bearer nas rotas de filme
> Atualizado em 2026-08-27 · fontes: `domains/movies` (hook, GuestQuotaService, Redis), `app.ts`, `AuthorizationHeaderUtils`

## O que é
O `POST /movie/recommendation` deixa de ser público irrestrito: visitante tem 2 recomendações 200 por `guest-id`; Bearer JWT válido é ilimitado. `GET /movie/queries` continua público, sem cota.

## Como funciona
- `MakeMovieRecommendationHttpFactory` monta JWT, Redis, cota, hook e controller com a mesma instância de `GuestQuotaService`.
- `MovieRecommendationAuthHook` no preHandler: Bearer válido marca autenticado; token inválido 401 sem cota; sem Bearer usa cookie `guest-id` ou UUID e `assertCanAcceptAnonymousRecommendation`.
- Parse do header: `AuthorizationHeaderUtils` no módulo auth.
- No 200 anônimo o controller incrementa Redis, seta cookie httpOnly (TTL 1 dia) e `X-Guest-Remaining`. CORS `exposedHeaders` libera o header para o SPA.
- Contador: Redis `guest:quota:<id>`, limite constante 2.

## Decisões e porquês
- Cota no backend, não só na UI — a API precisa recusar a 3ª.
- Identificar visitante por cookie, não por `chatid` — novo chat não zera a cota.
- Incremento só no 200 — falha do LLM não consome cota.
- Bearer inválido não vira anônimo — o 401 dispara o refresh silencioso (próxima feature).

## Notas
O SPA ainda não lê `X-Guest-Remaining` nem trava o input (features `silent-refresh` e `guest-chat-lock`).
