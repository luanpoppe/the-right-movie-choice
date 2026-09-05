# Tasks: remove-langchain-wrapper

> Parte de [`migrate-luanpoppe-ai`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F<n>.C<m>` (n = índice da feature na lista do `plan.md`; m = chunk dentro da feature).

## Chunks

### F5.C1 — Adapter leftover de recommendation

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/providers/langchain-movie-recommendation.provider.ts`, `packages/backend/src/domains/movies/infrastructure/providers/langchain-movie-recommendation.provider.spec.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) grep (ninguém importa) → 2) delete

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Apagar o provider LangChain de recommendation e o spec irmão. Não apagar query-examples leftover nem `lib/langchain`.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F5.C2 — Adapter leftover de query examples

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/providers/langchain-movies-query-examples.provider.ts`, `packages/backend/src/domains/movies/infrastructure/providers/langchain-movies-query-examples.provider.spec.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) grep → 2) delete

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Apagar o provider LangChain de query examples e o spec irmão. Não apagar `lib/langchain`.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F5.C3 — Utils de histórico morto

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/providers/chat-history-ai-messages.utils.ts`, `packages/backend/src/domains/movies/infrastructure/providers/specs/chat-history-ai-messages.utils.spec.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) grep → 2) delete

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Apagar `ChatHistoryAiMessagesUtils` e o spec. Ajustar testes que só afirmam “não importa o utils” se o grep do source quebrar (não recriar o utils).
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F5.C4 — Facade `Langchain` + prompts

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/lib/langchain/langchain.ts`, `packages/backend/src/lib/langchain/prompt/prompt.langchain.ts`
- **Depende de**: F5.C1, F5.C2
- **Ordem de revisão**: 1) grep `@/lib/langchain` → 2) delete

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Apagar a facade e o prompt LangChain. Model/enum ficam no próximo chunk.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F5.C5 — Model Gemini LangChain

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/lib/langchain/model/model.langchain.ts`, `packages/backend/src/lib/langchain/model/models.enum.ts`
- **Depende de**: F5.C4
- **Ordem de revisão**: 1) pasta vazia → 2) delete (inclui diretório `lib/langchain` se sobrar vazio)

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Apagar model/enum. Pasta `src/lib/langchain` some. Não tocar `lib/ai` nem `lib/redis`.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F5.C6 — Deps do package.json

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/package.json`, `pnpm-lock.yaml`
- **Depende de**: F5.C5
- **Ordem de revisão**: 1) package.json → 2) lock

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: `pnpm --filter @the-right-movie-choice/backend remove @langchain/core @langchain/google-genai langchain`. Manter `@langchain/langgraph-checkpoint-redis`. Não pin 0.3.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F5.C7 — README

Metadados (bullets, não checkboxes):
- **Arquivos**: `README.md`
- **Depende de**: F5.C6
- **Ordem de revisão**: 1) intro IA → 2) lib/ e adapters citados

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Tirar `lib/langchain`. Trocar `ChatHistoryRedisRepository` por `ChatHistoryAiMemoryRepository`/checkpointer. Intro: OpenRouter primário, Gemini opcional. Sem reescrever o README inteiro.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`
