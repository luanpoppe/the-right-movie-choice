# Tasks: tmdb-movie-queries

> Parte de [`tmdb-client`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F<n>.C<m>` (n = índice da feature na lista do `plan.md`; m = chunk dentro da feature).

## Chunks

### F2.C1 — Tipos MovieSearchHit e MovieCatalogDetails

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/domain/entities/movie-search.entity.ts`, `packages/backend/src/domains/movies/domain/entities/movie-catalog-details.entity.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `movie-search.entity.ts` → 2) `movie-catalog-details.entity.ts`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Tipos da aplicação: `MovieSearchHit` + `MovieSearchPage`; `MovieCatalogDetails` (médio + direção/5 elenco + providers BR + imdbId). Sem Zod TMDB, sem HTTP.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec tsc --noEmit`

### F2.C2 — Zod da resposta de search TMDB

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/modules/tmdb/infrastructure/http/tmdb-search-response.schema.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `tmdb-search-response.schema.ts`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Schema Zod do JSON de `/search/movie` (page, results com id/title/overview/poster_path/release_date). Parse falho → não mapear ainda (só o schema).
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec tsc --noEmit`

### F2.C3 — Zod da resposta de details TMDB

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/modules/tmdb/infrastructure/http/tmdb-movie-details-response.schema.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `tmdb-movie-details-response.schema.ts`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Schema Zod do details com `credits`, `watch/providers`, `external_ids` (append). Campos opcionais que a TMDB omite.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec tsc --noEmit`

### F2.C4 — Mapper TMDB → DTOs da aplicação

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/modules/tmdb/infrastructure/http/tmdb-catalog.mapper.ts`
- **Depende de**: F2.C1, F2.C2, F2.C3
- **Ordem de revisão**: 1) `tmdb-catalog.mapper.ts`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Classe mapper: search page → `MovieSearchPage`; details → `MovieCatalogDetails` (ano da release_date, Director + 5 elenco, providers `BR`, imdb_id). Zod fail no caller (chunk seguinte) vira 502.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec tsc --noEmit`

### F2.C5 — Porta e adapter devolvem DTOs

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/application/providers/movie-catalog.provider.ts`, `packages/backend/src/modules/tmdb/infrastructure/http/tmdb-http.client.ts`
- **Depende de**: F2.C4
- **Ordem de revisão**: 1) `movie-catalog.provider.ts` → 2) `tmdb-http.client.ts`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: `searchMovies` → `MovieSearchPage`; `getMovieDetails` → `MovieCatalogDetails`. Client faz `safeParse` Zod + mapper; falha → `TmdbHttpException` 502. Ajustar testes unitários do client que esperam JSON cru.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec tsc --noEmit`

### F2.C6 — Cache Redis de details

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/modules/tmdb/infrastructure/cache/tmdb-movie-details.cache.ts`, `packages/backend/src/modules/tmdb/domain/tmdb-cache.constants.ts`
- **Depende de**: F2.C1
- **Ordem de revisão**: 1) `tmdb-cache.constants.ts` → 2) `tmdb-movie-details.cache.ts`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Chave `catalog:movie:{id}:{lang}`; TTL 24h sem refresh no GET; `getString`/null no miss (não `Redis.get()` que vira `[]`); Redis down → log e degrada (sem throw).
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec tsc --noEmit`

### F2.C7 — Guard de loopback

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/modules/tmdb/infrastructure/http/tmdb-loopback.guard.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `tmdb-loopback.guard.ts`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Recusa request cujo IP remoto não é loopback (`127.0.0.1`, `::1`, `localhost`). Não altera `listen()`.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec tsc --noEmit`

### F2.C8 — Rotas debug e cache no details

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/modules/tmdb/infrastructure/http/controllers/tmdb-debug.controller.ts`, `packages/backend/src/modules/tmdb/infrastructure/http/controllers/tmdb-debug.routes.ts`, `packages/backend/src/app.ts`
- **Depende de**: F2.C5, F2.C6, F2.C7
- **Ordem de revisão**: 1) guard nas rotas → 2) controller → 3) `app.ts` (só `dev`/`test`)

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: `GET /debug/tmdb/search?query=&page=` (400 se query vazia); `GET /debug/tmdb/movies/:id`; details usa cache; registrar plugin só fora de `prod`; loopback no preHandler.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec tsc --noEmit`

### F2.C9 — Script de teste live

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/package.json`, `packages/backend/src/modules/tmdb/infrastructure/http/specs/tmdb-http.client.live.spec.ts`
- **Depende de**: F2.C5
- **Ordem de revisão**: 1) `package.json` → 2) spec live

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Script `test:tmdb-live` que **não** entra no `pnpm test` da CI; skip se não houver token; chama search+details reais.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec tsc --noEmit`
