# Spec: Client HTTP TMDB

> Parte de [`tmdb-client`](../../plan.md)

## Resumo

Transporte HTTP v3 da TMDB: Bearer, timeout, retry e mapeamento de erro. A porta de aplicação é de **catálogo de filmes** (`searchMovies`, `getMovieDetails`), não um `getJson` genérico. Cache Redis, DTOs Zod e rotas debug ficam na feature `tmdb-movie-queries`.

## Requirements (cenários BDD)

### REQ-1: GET 200 com Bearer e language

- **Dado que** o client tem token e um `fetch` injetado que responde 200 JSON
- **Quando** `getMovieDetails(11)` é chamado
- **Então** a URL é `https://api.themoviedb.org/3/movie/11?language=pt-BR`, header `Authorization: Bearer <token>`, e o retorno é o JSON parseado

### REQ-2: Retry em 429 e depois sucesso

- **Dado que** o `fetch` devolve 429, 429 e 200
- **Quando** `searchMovies` ou `getMovieDetails` é chamado
- **Então** há 3 tentativas, com espera `1000ms × 2^n` entre elas (n = 0, 1), e o JSON do 200 é retornado

### REQ-3: 401 da TMDB vira `TmdbHttpException`

- **Dado que** o `fetch` devolve 401
- **Quando** `searchMovies` ou `getMovieDetails` é chamado
- **Então** lança `TmdbHttpException` (`BaseException`) com `statusCode` 502 (não retenta 401)

### REQ-4: Timeout da tentativa

- **Dado que** o `fetch` não resolve em 5s
- **Quando** `searchMovies` ou `getMovieDetails` é chamado
- **Então** aborta a tentativa; se as tentativas esgotarem, `TmdbHttpException` com `statusCode` 504

## Edge cases

- Token ausente em `test` → `TmdbHttpException` 500 (ou equivalente de config) **antes** do `fetch`; em `dev`/`prod` o boot já falhou no Zod.
- 404 → `TmdbHttpException` 404, sem retry.
- 5xx: até 2 retries (mesmo backoff); se persistir → `TmdbHttpException` 503.
- 400/422 → sem retry; `TmdbHttpException` 502.
- Body JSON inválido em 200 → `TmdbHttpException` 502.
- Query `language` default `pt-BR` no transporte; `page` em `searchMovies` (default 1 no adapter).
- Log: método, path, status, latency; nunca o Bearer.

## Contratos

- Porta: `IMovieCatalogProvider` em `domains/movies/application/providers/movie-catalog.provider.ts` — `searchMovies(query, page?)` e `getMovieDetails(movieId)` (`Promise<unknown>` até a feature de DTOs). Adapter/env ficam em `modules/tmdb`. Sem `getJson(path)`.
- Adapter: `fetch` injetado (default `globalThis.fetch`); cada método mapeia para uma rota v3 (`/search/movie`, `/movie/{id}` + append).
- Env: `TMDB_ACCESS_TOKEN` obrigatório fora de `test` (`packages/backend/src/env.ts` + `.env.example`).
- Constantes (não env): timeout 5000ms; 2 retries; backoff base 1000ms; `language` default `pt-BR`.
- Uma classe `TmdbHttpException extends BaseException` + `statusCode` (não família de subclasses).
- Testes unitários em `specs/` ao lado da unidade; `fetch` fake injetado; sem rede.

## Dependências

- Nenhuma feature anterior. Próxima (`tmdb-movie-queries`) consome `IMovieCatalogProvider` (DTO, cache, rotas).
