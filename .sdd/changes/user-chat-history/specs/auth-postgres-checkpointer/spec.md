# Spec: Checkpointer Postgres para logados

> Parte de [`user-chat-history`](../../plan.md)

## Resumo

Torna a memória do agente de recommendation híbrida: requisições autenticadas (JWT válido) persistem turnos no checkpointer Postgres da `@luanpoppe/ai`  ||  guests continuam no Redis com TTL de 20 minutos. A escolha acontece na `MakeGetMovieRecommendationUseCaseFactory` a cada request, reutilizando o mesmo `chatId` como `threadId` — sem dual-write nem migração de histórico Redis.

## Requirements

### REQ-1: Memória durável para usuário autenticado

- **Dado que** o cliente envia `POST /movie/recommendation` com header `chatid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"` e `Authorization: Bearer <JWT válido>` do usuário `id = 7`
- **Quando** a factory monta o `AI` para esse request
- **Então** o config inclui `memory: { type: "postgres", connectionString: <DATABASE_URL> }`
- **E** não define `options.defaultTTL` nem `refreshOnRead` (sem expiração automática)

### REQ-2: Memória efêmera para guest

- **Dado que** o cliente envia `POST /movie/recommendation` com header `chatid` e **sem** `Authorization`
- **Quando** a factory monta o `AI` para esse request
- **Então** o config inclui `memory: { type: "redis", url: <REDIS_URL normalizado>, options: { defaultTTL: 1200, refreshOnRead: true } }`
- **E** o comportamento atual de TTL de 20 minutos e refresh-on-read permanece inalterado

### REQ-3: Critério de seleção na factory

- **Entrada** `MakeGetMovieRecommendationUseCaseFactory.create(options)` com `options.userId` inteiro positivo (fluxo autenticado do controller)
- **Saída** `buildAiConfig` escolhe backend `postgres`
- **Entrada** `create()` sem `userId` (guest ou chamada sem auth)
- **Saída** `buildAiConfig` escolhe backend `redis`

### REQ-4: Setup das tabelas LangGraph no Postgres

- **Entrada** primeiro uso do checkpointer Postgres em runtime (lazy, via `AIMemory.getCheckpointer()` da lib)
- **Saída** `PostgresSaver.setup()` roda de forma idempotente no mesmo `DATABASE_URL` do Prisma
- **Erro** pacote `@langchain/langgraph-checkpoint-postgres` ausente → falha explícita na subida do checkpointer  ||  não silencia

### REQ-5: Mesmo AI por request, sem dual-write

- **Entrada** request autenticado com `chatId` conhecido
- **Saída** um único `AI` por request grava e lê só no Postgres para aquele `threadId`
- **Erro** não grava turno simultaneamente em Redis e Postgres para o mesmo `chatId`

### REQ-6: Demais factories de AI intactas

- **Entrada** `MakeGetMoviesQueryExamplesUseCaseFactory` (e demais que não são recommendation)
- **Saída** config do `AI` **sem** bloco `memory`  ||  comportamento atual preservado

## Edge cases

- Guest faz turnos no Redis e depois loga reutilizando o mesmo `chatId` → histórico Redis é ignorado  ||  Postgres começa vazio para aquele `threadId` (sem migração — fora de escopo do plano)
- Postgres indisponível em request autenticado → request falha (erro propagado)  ||  **não** faz fallback silencioso para Redis
- `REDIS_URL` sem protocolo (`host:porta`) → continua prefixando `redis://` só para o checkpointer guest (regra já existente)
- JWT inválido → rejeitado no hook de auth antes da factory  ||  esta feature não altera esse fluxo
