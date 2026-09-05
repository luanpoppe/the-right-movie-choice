# Catálogo local no Postgres

> Atualizado em 2026-09-05 · fontes: `packages/backend/prisma/schema.prisma`, `IMovieCatalogRepository`, `PrismaMovieCatalogRepository`

## O que é

Persistência da ficha `MovieCatalogDetails` no Postgres via Prisma. Uma linha `Movie` por par `(tmdbId, language)`, com id interno autoincrement. Listas (gênero, diretor, elenco, país, watch provider) ficam em tabelas filhas.

## Como funciona

- Porta: `upsert`, `findByTmdbId`, `findByTitleAndYear`; idioma omitido vira `pt-BR`.
- Write: transação — upsert da linha `Movie` por `(tmdbId, language)`, depois replace das filhas (`deleteMany` + `createMany`). Elenco grava `sortOrder` na ordem do array. Unique P2002 vira `MovieCatalogImdbConflictException` (409).
- Read: SQL `unaccent` + `ILIKE` (trecho, sem acento, sem caixa), depois `findFirst` pelo `id` com include. Título vazio → `null`. Desempate `updatedAt` desc.
- Código em `packages/backend/src/domains/movies/infrastructure/repositories/movie-catalog/`.

## Decisões e porquês

- Unique composto com `language` — a mesma ficha TMDB em `pt-BR` e `en-US` são linhas distintas.
- Unique de IMDb permite vários NULL no Postgres; dois `imdbId` iguais no mesmo idioma violam.
- Replace de filhas no upsert, não merge — a ficha nova é a fonte da verdade (spec REQ-2).
- `Promise.all` dos `deleteMany` dentro de `$transaction` não paraleliza: uma conexão, uma query por vez.

## Lookup local-first (agente + debug)

- Agente: `MovieCatalogLookupService.findDetailsByTitle` — título fresco no banco (30 dias) aquece Redis e não chama search TMDB; miss/stale vai search + `MovieCatalogDetailsResolver`.
- Details por id: Redis → banco fresco → TMDB. Redis hit ignora frescor até o TTL. Banco velho tenta TMDB; se TMDB falhar, devolve a ficha velha. Miss TMDB grava só Redis (TTL 24h). Sem upsert Postgres nesta frente.
- Debug: `GET /debug/tmdb/movies/:id` usa o resolver. Search `/debug/tmdb/search` continua só TMDB. Query `language` opcional (vazio → `pt-BR`); `watch_region` TMDB continua `BR`.
- Wiring: factory de recommendation e `tmdbDebugControllers` montam Redis + cache + `PrismaMovieCatalogRepository` + resolver com `CatalogPersistEnqueuer.enqueue` explícito.

## Enqueue no miss TMDB (BullMQ)

- `CatalogPersistEnqueuer.enqueue(details, language)` — valida entrada, `Queue.add` na fila `catalog-movie-persist` com `jobId` `{tmdbId}:{language}` e `defaultJobOptions()`. Falha no add → warn, sem throw.
- `MovieCatalogDetailsResolver` chama enqueue após TMDB ok (miss ou refresh stale) — não enfileira em Redis hit, Postgres fresco ou fallback stale.
- Conexão Redis compartilhada entre Worker e Enqueuer via `CatalogPersistBullmqConnection` + `MakeCatalogPersistQueueFactory`.
- Call sites: `MakeGetMovieRecommendationUseCaseFactory` e `tmdbDebugControllers` injetam `CatalogPersistEnqueuer.enqueue` no resolver.

## Worker de persistência (BullMQ)

- Fila `catalog-movie-persist`, payload `{ language, details }`, `jobId` `{tmdbId}:{language}`.
- `CatalogPersistProcessor`: valida payload, `upsert` no repo, sem TMDB. Conflito IMDb e payload inválido completam o job (sem retry). Falha transitória relança para backoff 15s/1min/5min (4 corridas).
- `MakeCatalogPersistWorkerFactory`: Worker BullMQ concurrency 3, `removeOnFail` 500, `removeOnComplete` 1000. `defaultJobOptions()` expõe 4 tentativas para o enqueue.
- Boot: `app.onReady` → `CatalogPersistWorkerStarter.start()`. Falha Redis no boot → warn, HTTP sobe.

## Notas

- Search TMDB sozinha (lista de hits) não enfileira — só quando `MovieCatalogDetails` completo existe via `resolveByTmdbId`.
