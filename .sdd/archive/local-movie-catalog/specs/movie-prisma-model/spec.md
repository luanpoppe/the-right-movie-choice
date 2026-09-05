# Spec: Modelo Prisma de filme

> Parte de [`local-movie-catalog`](../../plan.md)

## Resumo

Persiste a ficha de details (`MovieCatalogDetails`) no Postgres: modelo `Movie` com id interno, unique (`tmdbId`, `language`) e unique (`imdbId`, `language`) quando há IMDb; listas em tabelas filhas. O repositório faz upsert (substitui filhas) e busca por tmdbId ou título+ano.

## Requirements

### REQ-1: Upsert por tmdbId + language

- **Entrada** ficha `Interestelar`, `tmdbId` `157336`, `language` omitido (vira `pt-BR`), `imdbId` `tt0816692`, gêneros `Ficção científica`/`Drama`, diretores `Christopher Nolan`, elenco com `Matthew McConaughey`, watch `Netflix` em `flatrate`.
- **Saída** linha `Movie` gravada/atualizada; filhas regravadas; leitura por `(157336, pt-BR)` devolve a mesma ficha (`MovieCatalogDetails.tmdbId` = 157336).
- **Erro** `imdbId` null: grava mesmo assim; unique de IMDb não se aplica a NULL.

### REQ-2: Upsert de novo substitui filhas

- **Entrada** mesmo `(157336, pt-BR)` com elenco só `Anne Hathaway` e sem `flatrate`.
- **Saída** gêneros/elenco/diretores/providers antigos some; só o lote novo permanece. `updatedAt` mais recente.

### REQ-3: Find por tmdbId + language

- **Entrada** `tmdbId` `157336`, `language` `pt-BR`.
- **Saída** `MovieCatalogDetails` ou `null` se não houver linha.

### REQ-4: Find por título + ano + language

- **Entrada** título `Senhor dos Aneis` (trecho, sem acento, case-insensitive), `year` `2014`, `language` `pt-BR`.
- **Saída** a linha cujo título contém o trecho (ex. `O Senhor dos Anéis`); se várias, a de `updatedAt` mais recente.
- **Erro** `year` omitido: qualquer ano daquele trecho+idioma, desempate `updatedAt` desc. Título vazio → `null` sem query.

## Edge cases

- Unique `(tmdbId, language)`: `157336` em `en-US` é outra linha, não sobrescreve `pt-BR`.
- Unique `(imdbId, language)`: mesmo `tt0816692` em `pt-BR` e `en-US` é permitido; dois `pt-BR` com o mesmo IMDb → violação unique.
- `language` no write: obrigatório no modelo; se o caller omitir, default `pt-BR`.
- Concorrência de dois upserts do mesmo par: o último write vence nas filhas; sem fila nesta feature.

## Contratos expostos

- Modelos `Movie`, filhas e enum `MovieWatchProviderKind`: `packages/backend/prisma/schema.prisma` (`Movie`, `MovieGenre`, `MovieDirector`, `MovieCast`, `MovieOriginCountry`, `MovieWatchProvider`).
- Migration: `packages/backend/prisma/migrations/20260905180000_add_movie_catalog/migration.sql`.
- Porta: `packages/backend/src/domains/movies/domain/repositories/movie-catalog.repository.ts` (`IMovieCatalogRepository`, `DEFAULT_MOVIE_CATALOG_LANGUAGE`).
- Tipo de ficha: `packages/backend/src/domains/movies/domain/entities/movie-catalog-details.entity.ts` (`tmdbId`).
- Adapter: `PrismaMovieRepository` no padrão de `packages/backend/src/modules/users/infrastructure/repositories/prisma-user.repository.ts`.
