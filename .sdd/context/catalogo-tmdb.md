# Catálogo TMDB (client HTTP)

> Atualizado em 2026-09-03 · fontes: `packages/backend/src/modules/tmdb`, `IMovieCatalogProvider`, rotas `/debug/tmdb`

## O que é

Transporte HTTP da TMDB API v3 no backend. A aplicação fala com `IMovieCatalogProvider`; search e details devolvem DTOs camelCase. Em `dev`/`test` há GETs debug só em loopback. Cache Redis só de details. O serviço `MovieCatalogLookupService` usa essa porta; a tool do agente é só `lookupMovies`.

## Como funciona

- Boot: `TMDB_ACCESS_TOKEN` obrigatório em `dev`/`prod`; em `test` pode faltar. Token raw na env; o código prefixa `Bearer`.
- Porta: `searchMovies` → `MovieSearchPage`; `getMovieDetails` → `MovieCatalogDetails`.
- Adapter: `TmdbHttpClient` — `fetch` + timeout 5s, retry 429/5xx. Depois do 200: Zod (`TmdbSearchResponseSchema` / `TmdbMovieDetailsResponseSchema`) + `TmdbCatalogMapper`. Payload inesperado → `TmdbHttpException` 502.
- Details TMDB: `append_to_response=credits,watch/providers,external_ids`, `watch_region=BR`, `language=pt-BR`. Search: `query` + `language=pt-BR`; ano opcional em `primary_release_year` (não concatenado no texto). Sem `include_adult`.
- Cache: `TmdbMovieDetailsCache`, chave `catalog:movie:{id}:{lang}`, TTL 24h, `getString` (não `Redis.get()`). GET não renova TTL. Redis down → log + miss/no-op.
- Debug: plugin `tmdbDebugControllers` só se `NODE_ENV !== "prod"`. `TmdbLoopbackGuard` no `preHandler`. Search: query vazia → 400; só TMDB. Details: `MovieCatalogDetailsResolver` (Redis → Postgres fresco → TMDB).
- Live: `pnpm --filter @the-right-movie-choice/backend test:tmdb-live` (projeto Vitest `tmdb-live`). `pnpm test` é só `--project unit` e exclui `*.live.spec.ts`.

## Decisões e porquês

- Porta no domínio `movies`, HTTP em `modules/tmdb` — trocar vendor não muda o contrato de catálogo.
- 502 em Zod fail: somos gateway; TMDB é upstream. Não é 400 nem 500.
- Debug sem JWT: trava é loopback + rotas inexistentes em prod.
- Sem cache de search: lista muda rápido; details é ficha estável o suficiente para 24h.
