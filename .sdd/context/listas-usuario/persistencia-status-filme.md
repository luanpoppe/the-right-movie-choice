# Persistência do status por filme (UserMovieEntry)

> Atualizado em 2026-09-06 · fontes: `UserMovieEntry` (Prisma), `IUserMovieEntryRepository`, `PrismaUserMovieEntryRepository`

## O que é

Uma linha Postgres por par `(userId, tmdbId)` com flags `watched`, `favorite`, `inWatchlist` e metadados opcionais de assistido (`rating` 1–10, `watchedAt`). FK opcional `movieId` → `Movie`. Feature interna — sem HTTP; a API de listas consome na frente seguinte.

## Como funciona

- **Schema**: `packages/backend/prisma/schema.prisma` — unique `(userId, tmdbId)`, cascade ao apagar `User`, `movieId` SetNull ao apagar `Movie`, CHECK `rating` entre 1 e 10.
- **Domínio**: tipos em `user-movie-entry.entity.ts`; validação em `UserMovieEntryValidationUtils` (tmdbId > 0, rating 1–10); porta `IUserMovieEntryRepository` com `findByUserAndTmdbId`, `upsert` parcial e `listByUser` com filtro por flag.
- **Infra**: `PrismaUserMovieEntryRepository` em `infrastructure/repositories/user-movie-entry/` — merge parcial (`UserMovieEntryMergeUtils` + `Object.hasOwn`), montagem de `where` (`UserMovieEntryListFilterUtils`), mapper Prisma (`UserMovieEntryPrismaMapper` em `infrastructure/mappers/`).
- **Upsert**: patch parcial preserva flags não enviados; `rating`/`watchedAt` sobrevivem ao desmarcar `watched`; linha removida quando os três flags ficam `false` (retorna `null`).

## Decisões e porquês

- Tabela única com booleans — consultas simples para os três estados fixos da UI; listas personalizáveis ficam para mudança futura. (origem: `user-watched-movies` plan, 2026-09-05)
- `Object.hasOwn` no patch — distinguir chave omitida de `false` explícito no upsert e no filtro de listagem. (origem: F1.C2/F1.C3, 2026-09-06)
- Validação fora da entity — `UserMovieEntryValidationUtils` em arquivo próprio; entity só tipos. (origem: revisão F1.C2)
- Utils de infra separados por responsabilidade — merge, list-filter e mapper em arquivos distintos na subpasta do repositório. (origem: revisão F1.C3)

## Notas

- Testes unitários cobrem domínio, merge, mapper e adapter (mock Prisma). Integração (cascade, CHECK Postgres, concorrência) não testada em unit.
- Próxima frente: SPA consome a API via `recommendation-expose-ids` e ações nos cards.
