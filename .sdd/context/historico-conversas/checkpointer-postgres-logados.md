# Checkpointer Postgres para usuários logados

> Atualizado em 2026-09-16 · fontes: `MakeGetMovieRecommendationUseCaseFactory`, `movie-recommendation.controller.ts`, spec `auth-postgres-checkpointer`

## O que é

Memória híbrida do agente de recommendation: requisições autenticadas persistem turnos no checkpointer Postgres da `@luanpoppe/ai`; guests continuam no Redis com TTL de 20 minutos. A escolha ocorre na factory a cada request, reutilizando o mesmo `chatId` como `threadId`.

## Como funciona

- **Critério:** `buildAiConfig(options)` usa `userId > 0` (mesmo padrão de `buildLookupToolOptions`) para escolher backend.
- **Autenticado:** `memory` recebe instância compartilhada de `MovieRecommendationPostgresMemory.getShared()` (singleton `AIMemory` postgres com `DATABASE_URL`) — sem `defaultTTL` nem `refreshOnRead`; evita novo `pg.Pool` por request.
- **Guest:** `memory: { type: "redis", url, options: { defaultTTL: 1200, refreshOnRead: true } }` — comportamento anterior preservado.
- **REDIS_URL** sem protocolo continua ganhando prefixo `redis://` via `toCheckpointerRedisUrl`.
- **Controller** passa `userId` em `resolveUseCaseOptions` quando JWT é válido; factory instanciada por request.
- **Dependência:** `@langchain/langgraph-checkpoint-postgres@1.0.5` no backend; setup das tabelas LangGraph é lazy via lib (`PostgresSaver.setup()`).
- **Demais factories** (ex.: query-examples) não recebem bloco `memory`.

## Decisões e porquês

- **Sem dual-write** — um único backend por request (`if/else` em `buildAiConfig`). (origem: spec REQ-5)
- **Sem fallback silencioso** — Postgres indisponível propaga erro; não volta para Redis. (origem: spec edge case)
- **Sem migração Redis→Postgres** — guest que loga com mesmo `chatId` ignora histórico Redis; Postgres começa vazio. (origem: plano, fora de escopo)
- **Postgres compartilha `DATABASE_URL` do Prisma** — mesmo banco, tabelas do checkpointer gerenciadas pela lib.

## Notas

- `MovieRecommendationPostgresMemory` cacheia um único `AIMemory` postgres por processo (correção code review A1).
- Metadados de conversa (`UserConversation`) são feature separada; esta feature só altera onde as mensagens persistem.
