# Tasks: recommendation-provider

> Parte de [`migrate-luanpoppe-ai`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F<n>.C<m>` (n = índice da feature na lista do `plan.md`; m = chunk dentro da feature).

## Chunks

### F2.C1 — Adapter AI + mapeamento de histórico

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/providers/chat-history-ai-messages.utils.ts`, `packages/backend/src/domains/movies/infrastructure/providers/movie-recommendation-prompts.ts`, `packages/backend/src/domains/movies/infrastructure/providers/ai-movie-recommendation.provider.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) utils (tuples → `AIMessages`) → 2) prompts → 3) provider (duas chamadas + logs + parse)

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Classe estática mapeia `ChatHistoryEntity` (`system`/`user`/`ai`) para `AIMessages`. `AiMovieRecommendationProvider` recebe `AI` no construtor (não instancia). `getStructuredMoviesRecommendation` usa os prompts atuais, `callStructuredOutput` com `AiModels.PRIMARY` e `MovieRecommendationSchema`; faz `safeParse` em `result.response` (não no envelope); falha → `WrongMovieSchemaFromLlmException`. `getChatResponse` usa `ai.call` e devolve `text`. Logs `Logger` com modelo, `durationMs`, sucesso/erro, sem body. Sem `console.log`. Sem `threadId`/memory. Assertion de Zod só na borda se o TS exigir. Não alterar factory nem o provider LangChain ainda.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F2.C2 — Factory: um `new AI()` por request

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/factories/make-get-movie-recommendation-use-case.factory.ts`
- **Depende de**: F2.C1
- **Ordem de revisão**: 1) factory

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Trocar LangChain/`BaseChatModel` por `new AI(config)` omitindo chaves `undefined` (`exactOptionalPropertyTypes`). Gemini + `aiModelsFallback` só se `StringUtils.isEmptyString(env.GEMINI_API_KEY)` for falso. Injetar em `AiMovieRecommendationProvider`. Redis/histórico iguais.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F2.C3 — Remover adapter LangChain de recommendation

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/providers/langchain-movie-recommendation.provider.ts`, `packages/backend/src/domains/movies/infrastructure/providers/langchain-movie-recommendation.provider.spec.ts`
- **Depende de**: F2.C2
- **Ordem de revisão**: 1) confirmar que nada importa o arquivo antigo → 2) delete

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Apagar o provider LangChain de recommendation e o spec irmão. Não apagar o provider de query examples nem `lib/langchain`.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`
