# Pool persistido de sugestões de busca

> Atualizado em 2026-09-14 · fontes: `MovieQuerySuggestion` (Prisma), `SeedMovieQuerySuggestionsUseCase`, `PoolFirstMovieQueryExamplesProvider`, `GET /movie/queries`

## O que é

Pool fixo de até 100 textos de sugestão de busca para a landing, persistidos no Postgres. O seed inicial popula o pool via IA em lotes de 25 (máx. 4 chamadas por execução). `GET /movie/queries` lê 3 sugestões aleatórias do pool quando há pelo menos 3 itens; caso contrário, ou em erro de Postgres, cai no provider IA existente. Rotação semanal (+5/−5) vem na feature `pool-weekly-rotation`.

## Como funciona

1. **Schema** — tabela `MovieQuerySuggestion`: `text` (casing original após trim), `textNormalized` (trim + lowercase, UNIQUE), `createdAt`.
2. **Repositório** — `IMovieQuerySuggestionRepository`: `count`, `listTexts`, `insertManySkipDuplicates`, `pickRandomTexts(limit)` (Prisma `$queryRaw` com `ORDER BY RANDOM() LIMIT n`, retorna coluna `text`).
3. **Seed IA** — `SeedMovieQuerySuggestionsUseCase` orquestra lotes via `IMovieQuerySuggestionBatchProvider`. CLI `pnpm seed:query-suggestions`; `db:migrate` encadeia o seed.
4. **Leitura na API** — `MakeGetMoviesQueryExamplesUseCaseFactory` monta `PoolFirstMovieQueryExamplesProvider(repository, AiMoviesQueryExamplesProvider)`. Se `count >= 3`, `pickRandomTexts(3)` e mapeia para `{ queryExamples: [{ queryExample }] }`. Se `count < 3` ou erro de banco, fallback IA integral (ignora pool parcial) com `Logger.info` (`insufficient_pool` ou `database_error`).
5. **Constantes** — `MovieQuerySuggestionPoolConstants`: `POOL_SIZE=100`, `SEED_BATCH_SIZE=25`, `SEED_MAX_CALLS_PER_RUN=4`, `SEED_IA_MAX_RETRIES=3`; `MOVIE_QUERY_EXAMPLES_COUNT=3` na entity.

## Decisões e porquês

- **`text` + `textNormalized` separados** — exibição preserva casing; dedup só em lowercase normalizado. (origem: spec pool-persistence-seed, 2026-09-14)
- **Pool parcial (<3) ignora banco** — não mistura 1–2 itens do pool com IA; cai no fluxo IA inteiro como pool vazio. (origem: spec pool-read-api, 2026-09-14)
- **Fallback por erro Postgres** — `count()` ou `pickRandomTexts` no `try/catch` delegam ao provider IA; log `database_error` em nível info. (origem: spec pool-read-api, 2026-09-14)
- **Contrato HTTP inalterado** — `{ queries: [{ queryExample }] }` com exatamente 3 itens; controller e Zod do SPA não mudam. (origem: plan query-suggestions-pool)
- **Seed idempotente, não destrutivo** — completa pool parcial sem apagar existentes; pool cheio encerra sem IA. (origem: plan query-suggestions-pool)

## Notas

- Resposta do pool validada com `MovieQueryExamplesSchema.safeParse` — se inválida (ex.: menos de 3 textos), fallback IA com log `invalid_pool_response`. (origem: code review A1, 2026-09-14)
- Concorrência entre dois seeds simultâneos: UNIQUE evita duplicata de texto, mas não garante teto de 100 linhas.
- Duas requisições simultâneas com pool ≥ 3 podem sortear conjuntos diferentes — sem lock de leitura.
