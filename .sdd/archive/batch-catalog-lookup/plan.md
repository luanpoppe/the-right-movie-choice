# Lookup em lote no catálogo

> **id**: `batch-catalog-lookup` · **criada**: 2026-09-05 · **idioma**: pt-BR

## Contexto

O agente chama `lookupMovies` com até 8 queries por turno. Hoje cada query dispara `findDetailsByTitle` em paralelo (`Promise.all`), gerando até 2 round-trips Postgres por filme (SQL de título + `findFirst` com filhas) e 1 `get`/`set` Redis por hit local. Com todos os filmes já no banco, isso soma ~16 queries e ~8 escritas Redis — desnecessário para um único lote. Esta mudança introduz caminho batch no repo/cache/serviço, mantendo a API unitária existente, e adiciona benchmarks Vitest para comparar latência antes e depois (base para README/currículo futuro, se o ganho for relevante).

## Decisões macro

- **Batch + unitário**: novos métodos batch em repositório, cache e serviço; `findDetailsByTitle` permanece para outros call sites. **Por quê**: escopo mínimo, sem quebrar debug ou testes existentes. **Alternativa descartada**: batch só na tool sem suporte nas camadas abaixo.
- **Lote misto em duas fases**: (1) hits locais (Postgres fresco + aquecimento Redis) resolvem em batch; (2) misses seguem fluxo atual por filme (search TMDB + `resolveByTmdbId`), com **`Promise.all` entre os misses** — paralelismo preservado como hoje. **Por quê**: cenário real do agente; TMDB continua unitário por filme, só não serializa os que falharam no batch local. **Alternativa descartada**: batch só quando 100% hit local; processar misses em série.
- **Contrato da tool inalterado**: schema Zod e formato de retorno de `lookupMovies` não mudam. **Por quê**: zero impacto no prompt/agente.
- **Benchmark Vitest**: testes de benchmark medindo repo/serviço (cenário fixo, ex. 8 filmes seedados), com baseline capturado antes da otimização para comparação objetiva. **Por quê**: evidência reproduzível para decisão de documentar em README/currículo depois. **Alternativa descartada**: script HTTP end-to-end (mais pesado para CI).
- **Reuso**: extender `PrismaMovieCatalogRepository` + `MovieCatalogTitleSearchSql`, `TmdbMovieDetailsCache`, `MovieCatalogLookupService` e `MovieCatalogLookupAiTool`; misses continuam em `MovieCatalogDetailsResolver`.

## Features (executadas sequencialmente)

1. **batch-catalog-lookup** — Batch Postgres/Redis no fluxo `lookupMovies`, API unitária preservada, e benchmarks Vitest antes/depois.

## Escopo

**Dentro**:
- Métodos batch no repositório (resolver títulos + `findMany` com filhas) e no cache Redis (`MGET`/pipeline de `SET`).
- Orquestração em duas fases no serviço/tool: batch local + `Promise.all` nos misses TMDB.
- Benchmarks Vitest comparáveis (antes/depois) no mesmo pacote backend.
- Testes unitários dos novos métodos (pasta `specs/`).

**Fora**:
- Rotas `GET /debug/tmdb/*`.
- Novo batch/agregação de chamadas TMDB (fase 2 mantém `Promise.all` de `findDetailsByTitle` por miss, como hoje).
- Alteração do contrato/prompt da tool `lookupMovies`.
- Atualização de README ou currículo (só depois, se o benchmark mostrar ganho relevante).
