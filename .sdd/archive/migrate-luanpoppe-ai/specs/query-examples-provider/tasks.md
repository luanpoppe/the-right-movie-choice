# Tasks: query-examples-provider

> Parte de [`migrate-luanpoppe-ai`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F<n>.C<m>` (n = índice da feature na lista do `plan.md`; m = chunk dentro da feature).

## Chunks

### F3.C1 — Adapter AI + prompt

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/providers/movie-query-examples-prompts.ts`, `packages/backend/src/domains/movies/infrastructure/providers/ai-movies-query-examples.provider.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) prompts (texto + temperature) → 2) provider (uma chamada structured)

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: `MovieQueryExamplesPrompts` com o texto atual e constante `QUERY_EXAMPLES_TEMPERATURE = 1.5`. `AiMoviesQueryExamplesProvider` recebe `AI` no construtor. `getQueryExamples` chama `callStructuredOutput` com `AiModels.PRIMARY`, `modelConfig: { temperature }`, `messages: [AIMessages.human(prompt)]` (sem systemPrompt se opcional), `MovieQueryExamplesSchema`; `safeParse(result.response)`; falha → `WrongMovieSchemaFromLlmException`. Logs modelo/`durationMs`/erro sem body. Sem factory, sem histórico/threadId.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F3.C2 — Factory: um `new AI()` por request

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/factories/make-get-movies-query-examples-use-case.factory.ts`
- **Depende de**: F3.C1
- **Ordem de revisão**: 1) factory

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Duplicar `buildAiConfig` privado (não extrair util). `new AI(config)` + `AiMoviesQueryExamplesProvider`. Remover Langchain, FLASH_LITE e `cache: false`.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F3.C3 — Remover adapter LangChain de query examples

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/providers/langchain-movies-query-examples.provider.ts`, `packages/backend/src/domains/movies/infrastructure/providers/langchain-movies-query-examples.provider.spec.ts`
- **Depende de**: F3.C2
- **Ordem de revisão**: 1) grep de imports → 2) delete

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Apagar o provider LangChain de query examples e o spec irmão. Não mexer em recommendation nem em `lib/langchain`.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`
