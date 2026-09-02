# Tasks: tmdb-http-client

> Parte de [`tmdb-client`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F<n>.C<m>` (n = índice da feature na lista do `plan.md`; m = chunk dentro da feature).

## Chunks

### F1.C1 — Env TMDB_ACCESS_TOKEN

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/env.ts`, `packages/backend/.env.example`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `env.ts` (Zod) → 2) `.env.example`

Passos (checkboxes — marcados `[~]` ao implementar):
- [~] **Faz**: Inclui `TMDB_ACCESS_TOKEN` obrigatório em `dev`/`prod` e opcional em `test`.
- [~] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec tsc --noEmit -p packages/backend`

### F1.C2 — Exception e constantes HTTP

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/modules/tmdb/domain/exceptions/tmdb-http.exception.ts`, `packages/backend/src/modules/tmdb/domain/tmdb-http.constants.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `tmdb-http.exception.ts` → 2) `tmdb-http.constants.ts`

Passos (checkboxes — marcados `[~]` ao implementar):
- [~] **Faz**: `TmdbHttpException` (`BaseException` + `statusCode`) e constantes (timeout 5000, 2 retries, backoff 1000ms, base URL v3, `language` pt-BR).
- [~] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec tsc --noEmit -p packages/backend`

### F1.C3 — Porta IMovieCatalogProvider

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/application/providers/movie-catalog.provider.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `movie-catalog.provider.ts`

Passos (checkboxes — marcados `[~]` ao implementar):
- [~] **Faz**: Interface `IMovieCatalogProvider` com `searchMovies` e `getMovieDetails`.
- [~] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec tsc --noEmit -p packages/backend`

### F1.C4 — Adapter IMovieCatalogProvider

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/modules/tmdb/infrastructure/http/tmdb-http.client.ts`, `packages/backend/src/modules/tmdb/infrastructure/http/tmdb-http.utils.ts`, `packages/backend/src/modules/tmdb/infrastructure/factories/make-tmdb-http-client.factory.ts`
- **Depende de**: F1.C1, F1.C2, F1.C3
- **Ordem de revisão**: 1) `tmdb-http.client.ts` → 2) factory

Passos (checkboxes — marcados `[~]` ao implementar):
- [~] **Faz**: Adapter que implementa `IMovieCatalogProvider` (`searchMovies` → `/search/movie`, `getMovieDetails` → `/movie/{id}`), `fetch` injetado (`Params`), Bearer, timeout, retry, logs sem token, `TmdbHttpException`.
- [~] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec tsc --noEmit -p packages/backend`
