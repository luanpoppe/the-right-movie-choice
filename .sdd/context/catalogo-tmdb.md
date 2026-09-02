# Catálogo TMDB (client HTTP)

> Atualizado em 2026-09-01 · fontes: `packages/backend/src/modules/tmdb`, `IMovieCatalogProvider`

## O que é

Transporte HTTP da TMDB API v3 no backend, ainda **sem** tools do chat e **sem** rotas debug (isso vem na feature de queries). A aplicação fala com `IMovieCatalogProvider` no domínio de filmes; a TMDB é um adapter substituível.

## Como funciona

- Boot: `TMDB_ACCESS_TOKEN` obrigatório em `dev`/`prod` (`env.ts`); em `test` pode faltar.
- Porta: `searchMovies` e `getMovieDetails` em `domains/movies/application/providers/movie-catalog.provider.ts`.
- Adapter: `TmdbHttpClient` + `TmdbHttpUtils` + `MakeTmdbHttpClientFactory` — Bearer no header, timeout 5s, até 3 tentativas com backoff só em 429/5xx.
- Details já pedem `append_to_response` (credits, watch/providers, external_ids) e `watch_region=BR`. O JSON ainda é `unknown` até os DTOs Zod.
- Erros viram `TmdbHttpException` (`BaseException` + `statusCode`).

## Decisões e porquês

- Porta no domínio `movies`, HTTP em `modules/tmdb` — trocar vendor não muda o contrato de catálogo.
- Token raw na env; o código prefixa `Bearer`. Sem token no log.
- `fetch` e `delay` injetáveis (`Params`) para teste sem rede e sem esperar backoff.
