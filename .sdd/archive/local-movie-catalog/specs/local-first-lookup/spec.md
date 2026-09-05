# Spec: Lookup local-first

> Parte de [`local-movie-catalog`](../../plan.md)

## Resumo

O lookup do agente e o GET de details em `/debug/tmdb` leem Redis → Postgres → TMDB. Título tenta o banco antes do search TMDB. Ficha no banco com `updatedAt` há menos de 30 dias vence. Esta feature **não** faz upsert no Postgres (fica F3/F4); no miss TMDB ainda grava Redis (TTL 24h). Search debug continua só TMDB.

## Requirements

### REQ-1: Agente acha filme já catalogado pelo título

- **Dado que** o agente pede ficha com query `Interestelar` e a linha `Movie` `pt-BR` existe com `updatedAt` há 3 dias
- **Quando** `MovieCatalogLookupService.findDetailsByTitle` roda
- **Então** não chama search TMDB; devolve `found: true` com a ficha local; aquece Redis na chave de details (`157336`, `pt-BR`)

### REQ-2: Agente não acha no banco e cai no TMDB

- **Dado que** não há linha cujo título contenha `Duna` em `pt-BR`
- **Quando** o agente busca `Duna`
- **Então** faz search TMDB, pega o 1º hit, resolve details na ordem Redis → banco (se `updatedAt` < 30 dias) → TMDB; devolve a ficha; se veio do TMDB, grava só Redis

### REQ-3: Debug GET details no mesmo pipeline

- **Dado que** o cliente chama `GET /debug/tmdb/movies/157336`
- **Quando** o controller resolve a ficha
- **Então** usa Redis → banco (frescor 30 dias) → TMDB; HTTP 200 com `MovieCatalogDetails`; miss TMDB grava Redis, não Postgres
- **Erro** id não inteiro: 400 (`TmdbDebugInvalidMovieIdException`)

### REQ-4: Banco velho (> 30 dias) busca TMDB

- **Entrada** `Movie` `tmdbId` `157336` `pt-BR` com `updatedAt` há 31 dias; Redis vazio
- **Saída** details do TMDB na resposta (ou, se TMDB falhar, a ficha velha + log); Redis atualizado se TMDB ok. **Não** upsert no Postgres e **não** enqueue nesta feature — a linha velha continua até `catalog-persist-worker` + `enqueue-on-tmdb-miss` (aí o miss/refetch TMDB entra na fila e o worker grava o upsert).
- **Erro** TMDB fora e sem linha no banco: agente miss amigável (igual hoje)

### REQ-5: Camada fora do ar é pulada

- **Entrada** Redis get/set lança; ou `findByTmdbId`/`findByTitleAndYear` lança
- **Saída** loga e segue a próxima camada (Redis down → banco; banco down no título → search TMDB; banco down no details → TMDB)
- **Erro** TMDB HTTP no caminho sem fallback local: agente `found: false` com mensagem de catálogo indisponível

### REQ-6: Search debug não usa o catálogo local

- **Dado que** o cliente chama search `/debug/tmdb` com `query=star`
- **Quando** a busca roda
- **Então** só `IMovieCatalogProvider.searchMovies` (TMDB); HTTP 200 com a página; não consulta Postgres nem grava lista

## Edge cases

- Redis hit (TTL 24h) devolve L1 mesmo que o Postgres esteja com `updatedAt` > 30 dias — o frescor de 30 dias vale depois que o Redis expira.
- Empate de título local: mesma regra de `findByTitleAndYear` (trecho unaccent, `updatedAt` DESC, 1 linha).
- Idioma omitido: `pt-BR`. Idioma informado (ex. `en-US`) vale no find local, na chave Redis e na TMDB; `watch_region` continua `BR`.
- Query vazia no agente: miss atual (“Informe o nome…”), sem TMDB.

## Contratos expostos

- Lookup do agente: `packages/backend/src/domains/movies/infrastructure/providers/movie-catalog-lookup.service.ts` (`findDetailsByTitle`).
- Cache L1: `packages/backend/src/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache.ts` (`TmdbMovieDetailsCache`).
- Debug HTTP: `packages/backend/src/modules/tmdb/infrastructure/http/controllers/tmdb-debug.controller.ts` (`search`, `getMovie`).
- Porta TMDB: `packages/backend/src/domains/movies/application/providers/movie-catalog.provider.ts` (`IMovieCatalogProvider`).
- Reads locais: `IMovieCatalogRepository.findByTmdbId` / `findByTitleAndYear`.
