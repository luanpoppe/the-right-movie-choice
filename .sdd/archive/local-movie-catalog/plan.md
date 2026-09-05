# Catálogo local de filmes

> **id**: `local-movie-catalog` · **criada**: 2026-09-05 · **idioma**: pt-BR

## Contexto

Hoje o agente de recomendação ignora o Redis e vai direto ao TMDB. Esta mudança liga o cache no caminho do agente, cria catálogo no Postgres e define a ordem Redis → banco → TMDB. No miss do TMDB, a ficha persiste em background via fila para não atrasar a resposta.

## Decisões macro

- **Decisão**: Prisma + Postgres, modelo de filme com `tmdbId` e `imdbId`. **Por quê**: stack já usado em User. **Alternativa descartada**: outro store.
- **Decisão**: persistir só a ficha de **details** do filme escolhido no lookup (não a lista de search). **Por quê**: é o que o agente usa. **Alternativa descartada**: gravar cada hit da search.
- **Decisão**: lookup do agente na ordem Redis (L1, 24h) → Postgres (L2) → TMDB. **Por quê**: o cache hoje só existe no debug; o agente precisa do mesmo atalho. **Alternativa descartada**: banco primeiro; Redis só no debug.
- **Decisão**: estender `MovieCatalogLookupService` + repo Prisma; reusar `TmdbMovieDetailsCache` e `IMovieCatalogProvider`. **Por quê**: peças já existem. **Alternativa descartada**: serviço paralelo do zero.
- **Decisão**: BullMQ no Redis existente; save no banco não bloqueia a resposta; falha de persistência só loga. **Por quê**: fila de verdade sem broker novo. **Alternativa descartada**: fire-and-forget sem fila; falhar o turno se o save falhar.
- **Decisão**: ordem 1 modelo → 2 lookup só leitura (+ Redis no miss TMDB) → 3 worker → 4 enqueue no miss. **Por quê**: grill da F2: persistir Postgres só na fila; write síncrono no banco foi descartado. **Alternativa descartada**: upsert síncrono na F2.

## Features (executadas sequencialmente)

1. **movie-prisma-model** — Modelo Prisma + repositório da ficha (tmdbId, imdbId), no padrão de persistência de User.
2. **local-first-lookup** — Redis → banco → TMDB no agente e no GET debug de details; título no banco antes do search TMDB; sem upsert Postgres; Redis no miss TMDB.
3. **catalog-persist-worker** — Worker BullMQ no Redis atual que persiste a ficha no repositório.
4. **enqueue-on-tmdb-miss** — Troca o write síncrono por enqueue; a resposta não espera o save.

## Escopo

**Dentro**: catálogo local de details; lookup do agente com Redis → banco → TMDB; `/debug/tmdb`; fila BullMQ de persistência.

**Fora**: persistir resultados de search; UI; backfill histórico; troca de vendor TMDB; histórico de chat.
