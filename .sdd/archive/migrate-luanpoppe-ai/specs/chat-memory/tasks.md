# Tasks: chat-memory

> Parte de [`migrate-luanpoppe-ai`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F<n>.C<m>` (n = índice da feature na lista do `plan.md`; m = chunk dentro da feature).

## Chunks

### F4.C1 — Adapter AIMemory da porta de histórico

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/infrastructure/repositories/chat-history-ai-memory.repository.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) adapter

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: `ChatHistoryAiMemoryRepository` implementa `IChatHistoryRepository`, recebe `AI` no construtor. `getHistory(chatId)` chama `ai.memory.getHistory(chatId)`, mapeia `human`→`user`, `ai`→`ai`, ignora `tool`. Porta sem `addMessage`. Sem factory neste chunk.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F4.C2 — Porta + provider: `chatId` e `threadId`

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/application/providers/movie-recommendation.provider.ts`, `packages/backend/src/domains/movies/infrastructure/providers/ai-movie-recommendation.provider.ts`, `packages/backend/src/domains/movies/infrastructure/providers/specs/ai-movie-recommendation.provider.spec.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) porta → 2) provider → 3) spec

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Trocar `chatHistory` por `chatId: string` na porta e no `AiMovieRecommendationProvider`. Calls passam `threadId: chatId`; `messages` só o turno atual (sem `ChatHistoryAiMessagesUtils`). Atualizar o spec existente da assinatura/payload. Não alterar factory nem use case neste chunk (o compile do use case quebra até o C3 — aceito se o teste unitário do provider passar; se o `pnpm test` do pacote falhar só no use case, pare e deixe o C3 no mesmo turno **não**: o principal parte. Se a suíte inteira quebrar, o C3 já está no tasks — este chunk deve pelo menos o spec do provider verde; ajustar o spec do use case só no C3).
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend exec vitest run --project unit src/domains/movies/infrastructure/providers/specs/ai-movie-recommendation.provider.spec.ts`


### F4.C3 — Use case sem load/save Redis

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/application/use-cases/get-movie-recommendation.use-case.ts`, `packages/backend/src/domains/movies/application/use-cases/get-movie-recommendation.use-case.spec.ts`, `packages/backend/src/domains/movies/infrastructure/factories/make-get-movie-recommendation-use-case.factory.ts`
- **Depende de**: F4.C2
- **Ordem de revisão**: 1) use case → 2) spec

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Remover `IChatHistoryRepository` do construtor. `execute` só chama o provider com `userMessage` e `chatId`. Sem `getHistory`. Factory só passa o provider (Redis JSON saiu daqui para compilar). Atualizar o spec.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F4.C4 — Factory: memory Redis no mesmo `AI`

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/factories/make-get-movie-recommendation-use-case.factory.ts`, `packages/backend/package.json`, `packages/backend/src/domains/movies/infrastructure/factories/specs/make-get-movie-recommendation-use-case.factory.spec.ts`
- **Depende de**: F4.C3
- **Ordem de revisão**: 1) constante TTL + `memory` no `buildAiConfig` → 2) lockfile/package → 3) spec da factory

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: `pnpm --filter @the-right-movie-choice/backend add @langchain/langgraph-checkpoint-redis`. Constante `CHAT_MEMORY_TTL_SECONDS = 1200` (não env). `buildAiConfig` inclui `memory: { type: "redis", url: env.REDIS_URL, options: { defaultTTL, refreshOnRead: true } }` (omitir só o que a tipagem permitir). Um `new AI(config)` no provider. Sem `new Redis()` / `ChatHistoryRedisRepository`. Query examples intacta. Adapter C1 **não** precisa ser injetado.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F4.C5 — Remover Redis JSON de histórico

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/infrastructure/repositories/chat-history-redis.repository.ts`
- **Depende de**: F4.C4
- **Ordem de revisão**: 1) grep → 2) delete

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: Apagar `ChatHistoryRedisRepository` se nada mais importar. Não apagar `lib/redis` (auth/refresh ainda usa).
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`
