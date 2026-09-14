# Pool persistido de sugestões de busca

> Atualizado em 2026-09-14 · fontes: `MovieQuerySuggestion` (Prisma), `SeedMovieQuerySuggestionsUseCase`, `pnpm seed:query-suggestions`

## O que é

Pool fixo de até 100 textos de sugestão de busca para a landing, persistidos no Postgres. O seed inicial popula o pool via IA em lotes de 25 (máx. 4 chamadas por execução). Esta feature cobre só persistência + seed — a leitura na API e a rotação semanal vêm nas features seguintes.

## Como funciona

1. **Schema** — tabela `MovieQuerySuggestion`: `text` (casing original após trim), `textNormalized` (trim + lowercase, UNIQUE), `createdAt`.
2. **Repositório** — `IMovieQuerySuggestionRepository`: `count`, `listTexts`, `insertManySkipDuplicates` (Prisma `createMany` + `skipDuplicates`).
3. **Seed IA** — `SeedMovieQuerySuggestionsUseCase` orquestra lotes via `IMovieQuerySuggestionBatchProvider` (`AiMovieQuerySuggestionBatchProvider`). Prompt inclui todos os textos existentes; retry 3× por lote; aceita lote parcial após insert.
4. **CLI** — `pnpm seed:query-suggestions` (script `src/scripts/seed-query-suggestions.ts`). `db:migrate` encadeia o seed ao final (`prisma migrate dev && pnpm seed:query-suggestions`).
5. **Constantes** — `MovieQuerySuggestionPoolConstants`: `POOL_SIZE=100`, `SEED_BATCH_SIZE=25`, `SEED_MAX_CALLS_PER_RUN=4`, `SEED_IA_MAX_RETRIES=3`.

## Decisões e porquês

- **`text` + `textNormalized` separados** — exibição preserva casing; dedup só em lowercase normalizado. (origem: spec pool-persistence-seed, 2026-09-14)
- **Porta `IMovieQuerySuggestionBatchProvider` em `domain/providers/`** — contrato de lote IA separado do use case, implementado pelo adapter infra. (origem: revisão F1.C4, 2026-09-14)
- **Seed idempotente, não destrutivo** — completa pool parcial sem apagar existentes; pool cheio encerra sem IA. (origem: plan query-suggestions-pool)
- **Provider IA one-shot** — `systemPrompt` + `messages: []`, paridade com landing. (origem: F1.C3)

## Notas

- Pool vazio ainda não é tratado na API — feature `pool-read-api` fará leitura aleatória + fallback IA.
- Concorrência entre dois seeds simultâneos: UNIQUE evita duplicata de texto, mas não garante teto de 100 linhas (edge case documentado na spec).
