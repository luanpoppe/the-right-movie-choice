# Histórico de chat no Redis
> Atualizado em 2026-09-04 · fontes: `MakeGetMovieRecommendationUseCaseFactory`, `AiMovieRecommendationProvider`, `ChatHistoryAiMemoryRepository`

## O que é
Memória de conversa por sessão anônima: o checkpointer Redis da `@luanpoppe/ai` guarda o turno no `invoke` (`threadId` = header `chatid`). TTL 20 min. Sem Postgres e sem usuário logado.

## Como funciona
- Factory de recommendation: `new AI(config)` com `memory: { type: "redis", url, options: { defaultTTL: 1200, refreshOnRead: true } }`. Se `REDIS_URL` vier como `host:porta` (ioredis), a factory prefixa `redis://` antes do checkpointer. Pacote `@langchain/langgraph-checkpoint-redis`.
- Provider: `threadId: chatId`; `messages` só o turno atual. Query examples **sem** `memory`.
- Use case: só chama o provider (`userMessage` + `chatId`). Não faz `getHistory`/`addMessage`.
- Porta `IChatHistoryRepository`: só `getHistory`. Adapter `ChatHistoryAiMemoryRepository` mapeia `human`→`user`, `ai`→`ai`, ignora `tool`. Não é injetado no use case.
- Identidade: UUID no frontend, header `chatId`. `lib/redis` continua para auth/refresh.

## Decisões e porquês
- Persistência = invoke + `threadId` — dual-write no JSON antigo duplicava estado (origem: migrate-luanpoppe-ai, 2026-09-04).
- TTL em constante `CHAT_MEMORY_TTL_SECONDS`, não env.
- Sem prefixo na API da lib; mesmo `REDIS_URL` do refresh, namespaces distintos.
- Redis 8+ / RedisJSON é requisito da lib — Docker clássico é risco conhecido.

## Notas
Chaves JSON antigas (`chatId` → array) expiram no TTL que já tinham; sem migração. `ChatHistoryRedisRepository` foi removido.
