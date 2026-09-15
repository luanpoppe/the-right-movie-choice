# Pool persistido de sugestões de busca

> Atualizado em 2026-09-14 · fontes: `MovieQuerySuggestion` (Prisma), `SeedMovieQuerySuggestionsUseCase`, `RotateMovieQuerySuggestionsUseCase`, `PoolFirstMovieQueryExamplesProvider`, `GET /movie/queries`, `MovieQuerySuggestionPoolRotationScheduler`

## O que é

Pool de sugestões de busca para a landing, persistido no Postgres (alvo 100 itens, pode ficar acima após rotações). O seed inicial popula via IA em lotes de 25 (máx. 4 chamadas por execução). `GET /movie/queries` lê 3 aleatórias quando há pelo menos 3 no pool; caso contrário, ou em erro de Postgres, cai no provider IA. Em produção, job semanal (domingo 03:00 `America/Sao_Paulo`) completa pool abaixo de 100 e rotaciona +5/−5 quando `count >= POOL_SIZE`.

## Como funciona

1. **Schema** — tabela `MovieQuerySuggestion`: `text` (casing original após trim), `textNormalized` (trim + lowercase, UNIQUE), `createdAt`.
2. **Repositório** — `IMovieQuerySuggestionRepository`: `count`, `listTexts`, `insertManySkipDuplicates`, `pickRandomTexts(limit)` (Prisma `$queryRaw` com `ORDER BY RANDOM() LIMIT n`, retorna coluna `text`).
3. **Seed IA** — `SeedMovieQuerySuggestionsUseCase` orquestra lotes via `IMovieQuerySuggestionBatchProvider`. CLI `pnpm seed:query-suggestions`; `db:migrate` encadeia o seed.
4. **Leitura na API** — `MakeGetMoviesQueryExamplesUseCaseFactory` monta `PoolFirstMovieQueryExamplesProvider(repository, AiMoviesQueryExamplesProvider)`. Se `count >= 3`, `pickRandomTexts(3)` e mapeia para `{ queryExamples: [{ queryExample }] }`. Se `count < 3` ou erro de banco, fallback IA integral (ignora pool parcial) com `Logger.info` (`insufficient_pool` ou `database_error`).
5. **Constantes** — `MovieQuerySuggestionPoolConstants`: `POOL_SIZE=100`, `SEED_BATCH_SIZE=25`, `ROTATION_BATCH_SIZE=5`, `SEED_MAX_CALLS_PER_RUN=4`, `SEED_IA_MAX_RETRIES=3`, `SEED_ADVISORY_LOCK_KEY`; `MOVIE_QUERY_EXAMPLES_COUNT=3` na entity.
6. **Rotação semanal** — `RotateMovieQuerySuggestionsUseCase` sob `withSeedLock` (`pg_advisory_xact_lock` na mesma transação Prisma): se `count < 100`, top-up via IA (`POOL_SIZE - count`, `insertManySkipDuplicates`, sem delete); se após top-up `count >= 100`, gera lote de 5, valida `texts.length === 5` e só então `rotatePoolAtomically` (insert + delete dos 5 `createdAt` mais antigos na mesma transação; aborta se `insertedCount !== 5`). `MovieQuerySuggestionPoolRotationScheduler` (`node-cron`) dispara em prod no `onReady` do Fastify.

## Decisões e porquês

- **`text` + `textNormalized` separados** — exibição preserva casing; dedup só em lowercase normalizado. (origem: spec pool-persistence-seed, 2026-09-14)
- **Pool parcial (<3) ignora banco** — não mistura 1–2 itens do pool com IA; cai no fluxo IA inteiro como pool vazio. (origem: spec pool-read-api, 2026-09-14)
- **Fallback por erro Postgres** — `count()` ou `pickRandomTexts` no `try/catch` delegam ao provider IA; log `database_error` em nível info. (origem: spec pool-read-api, 2026-09-14)
- **Contrato HTTP inalterado** — `{ queries: [{ queryExample }] }` com exatamente 3 itens; controller e Zod do SPA não mudam. (origem: plan query-suggestions-pool)
- **Seed idempotente, não destrutivo** — completa pool parcial sem apagar existentes; pool cheio encerra sem IA. (origem: plan query-suggestions-pool)
- **Rotação atômica +5/−5** — insert e delete na mesma transação Prisma; lote incompleto ou falha IA → rollback, pool intacto. (origem: spec pool-weekly-rotation, revisão F3.C2, 2026-09-14)
- **Top-up antes da rotação** — pool abaixo de 100 é completado na mesma execução do job; top-up parcial (duplicatas) encerra sem rotacionar. (origem: revisão F3.C2, 2026-09-14)
- **Pool acima de 100 também rota** — `count >= POOL_SIZE` (não só `=== 100`); count não normaliza para 100 numa passada (ex.: 101 permanece 101). (origem: revisão F3.C2, 2026-09-14)
- **Cron só em prod** — `NODE_ENV=prod` no scheduler e no `app.ts`; dev/test não registram job. (origem: spec pool-weekly-rotation)
- **`AiConfigBuilder`** — config OpenRouter/Gemini compartilhada entre factories que instanciam `AI`. (origem: refactor F3.C3, 2026-09-14)
- **Guard de lote IA na rotação** — use case rejeita `texts.length !== ROTATION_BATCH_SIZE` antes de `rotatePoolAtomically`; top-up continua aceitando lote parcial. (origem: code review A1, fechamento F3, 2026-09-14)
- **`withSeedLock` transacional** — `prisma.$transaction` + `pg_advisory_xact_lock` (timeout 5 min, não o default 5s do Prisma); liberação automática no commit/rollback, sem unlock manual em outra conexão. (origem: code review A2, fechamento F3, 2026-09-14)

## Notas

- Resposta do pool validada com `MovieQueryExamplesSchema.safeParse` — se inválida (ex.: menos de 3 textos), fallback IA com log `invalid_pool_response`. (origem: feature pool-read-api)
- Concorrência entre dois seeds simultâneos: UNIQUE evita duplicata de texto, mas não garante teto de 100 linhas.
- Duas requisições simultâneas com pool ≥ 3 podem sortear conjuntos diferentes — sem lock de leitura.
