# Spec: Memória de chat via @luanpoppe/ai

> Parte de [`migrate-luanpoppe-ai`](../../plan.md)

## Resumo

O POST de recommendation persiste o turno no checkpointer Redis da lib (`memory` + `threadId` = `chatId`). Não há dual-write no JSON antigo. Query examples continua sem memory.

## Requirements (cenários BDD)

### REQ-1: Factory liga memory no mesmo `AI` da recommendation

- **Dado que** `MakeGetMovieRecommendationUseCaseFactory.create()` roda
- **Quando** monta o `AI`
- **Então** o mesmo `new AI(config)` do provider inclui `memory: { type: "redis", url: env.REDIS_URL, options: { defaultTTL: 1200, refreshOnRead: true } }` (1200 = 20 min; constante nomeada, não env)
- **E** instala `@langchain/langgraph-checkpoint-redis` (a lib faz `RedisSaver.fromUrl`)
- **E** some `new Redis()` / `ChatHistoryRedisRepository` desta factory
- **E** query examples não ganha `memory`

### REQ-2: Calls com `threadId`, sem reenviar o histórico

- **Dado que** o provider tem `memory` no `AI`
- **Quando** `callStructuredOutput` / `call` rodam
- **Então** passam `threadId` igual ao `chatId` do use case
- **E** `messages` só o turno atual (human / human+contexto de filmes no chat), **sem** `ChatHistoryAiMessagesUtils` na call
- **E** a lib lança se `threadId` faltar — o adapter não engole isso

### REQ-3: Use case e portas

- **Dado que** `GetMovieRecommendationUseCase.execute(userMessage, chatId)` roda
- **Quando** pede structured + chat
- **Então** não chama `getHistory` (a invoke já persiste o turno)
- **E** `IMovieRecommendationProvider` troca `chatHistory` por `chatId: string` nos dois métodos
- **E** `IChatHistoryRepository` só expõe `getHistory` (sem `addMessage`)
- **E** HTTP/`chatid`/SPA/cota não mudam

### REQ-4: Adapter da porta de histórico

- **Dado que** a porta `IChatHistoryRepository` permanece no core
- **Quando** alguém chama `getHistory(chatId)`
- **Então** uma classe nova (`ChatHistoryAiMemoryRepository` ou equivalente) usa `ai.memory.getHistory(chatId)` e mapeia roles para `ChatHistoryEntity`
- **E** a porta **não** tem `addMessage` (persistência é o invoke + `threadId`)
- **E** a factory **não** precisa injetar o adapter no use case se `execute` não usa a porta

## Edge cases

- Chaves JSON antigas (`chatId` → array) expiram no TTL que já têm; sem migração.
- Sem prefixo na API da lib (`RedisCheckpointerConfig.options` só `defaultTTL` / `refreshOnRead`) — mesmo `REDIS_URL` do refresh token; namespaces diferentes do LangGraph vs auth.
- Redis 8+ / RedisJSON conforme a lib; se o Docker local for Redis clássico, isso é risco conhecido (anotar na implementação se quebrar).
- `ChatHistoryAiMessagesUtils` só permanece se o adapter de `getHistory` reusar o mapeamento; senão some do provider.
- Duas chamadas LLM continuam (follow-up de unificar).

## Contratos

- `IMovieRecommendationProvider`: `chatId` no lugar de `ChatHistoryEntity`.
- `IChatHistoryRepository`: só `getHistory`. implementação Redis JSON sai da factory.
- `threadId` em `AICallParams` (`@luanpoppe/ai`).
- Constante de TTL 1200s no módulo da factory/memory, não env.
