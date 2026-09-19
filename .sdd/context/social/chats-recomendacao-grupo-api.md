# Chats e recomendação em grupo (API)

> Atualizado em 2026-09-19 · fontes: `GroupChat` Prisma, use cases sociais, pipeline `GetMovieRecommendationUseCase`, rotas `/social/groups/:groupId/chats*`

## O que é

API backend para múltiplos chats por grupo: metadados em Postgres (`GroupChat`), histórico compartilhado no checkpointer Postgres (mesmo `chatId` UUID), filtro configurável de membros para exclude de assistidos, e recomendação reutilizando o pipeline de IA individual com união multi-usuário.

## Como funciona

### Modelo

- Tabela `GroupChat`: `groupId` FK → `UserGroup`, `chatId` UUID único, `title` nullable, `filterMemberUserIds Int[]`, timestamps.
- Ao criar chat: `chatId` gerado no servidor; `filterMemberUserIds` default = todos os membros atuais do grupo.
- Histórico: `IChatHistoryRepository` (Postgres via `ChatHistoryAiMemoryRepository`) keyed por `chatId`; enrich de catálogo no GET como conversas individuais.

### Rotas (JWT via `UserMovieEntryAuthHook`)

| Método | Rota | Ação |
|--------|------|------|
| POST | `/social/groups/:groupId/chats` | Criar chat |
| GET | `/social/groups/:groupId/chats` | Listar por `updatedAt desc` |
| GET | `/social/groups/:groupId/chats/:chatId` | Metadados + `messages` |
| PATCH | `/social/groups/:groupId/chats/:id` | Renomear (`id` numérico) |
| DELETE | `/social/groups/:groupId/chats/:id` | Excluir + purge threads |
| PATCH | `/social/groups/:groupId/chats/:id/filter-members` | Atualizar filtro |
| POST | `/social/groups/:groupId/chats/:chatId/recommendation` | Recomendação (`body.query`) |

Factory: `MakeGroupChatsHttpFactory` — compõe repos Prisma, AI memory Postgres, `MakeGetMovieRecommendationUseCaseFactory`, `RecommendInGroupChatUseCase`.

### Recomendação

- `RecommendInGroupChatUseCase`: guard membro → resolve chat por `chatId` → `GetMovieRecommendationUseCase` com `excludeWatched: true` e `filterUserIds: chat.filterMemberUserIds`.
- Ordem pós-sucesso: recommendation → `touchUpdatedAt` → `updateTitle` (primeiro turno com título null gera título em paralelo com a IA, como conversas individuais).
- Resposta HTTP: `MovieRecommendationResponseMapper` (mesmo contrato de `POST /movie/recommendation`).
- `filterMemberUserIds` vazio + `excludeWatched: true` → pipeline cai em single-turn sem exclude (REQ-8).

### Exclude multi-usuário

- `findWatchedTmdbIdsByUsers(userIds[], tmdbIds[])` no repositório de entradas: união — filme assistido se **qualquer** membro do filtro marcou watched.
- Threads exclude reutilizam sufixo `:exclude:{1..5}` do pipeline individual, agora com lookup multi-usuário.

### Auth e erros

- Não-membro ou grupo inexistente → `404` genérico (`NotGroupMemberException` / `UserGroupNotFoundException`) — mesmo padrão de `grupos-api.md`.
- Chat não encontrado no grupo → `GroupChatNotFoundException(0)` quando busca por `chatId`; id numérico inválido usa id real na exception.
- PATCH filter-members com ids fora do grupo → `400` com `{ error, invalidUserIds }` (controller serializa `GroupChatInvalidFilterMemberUserIdsException`).

## Decisões e porquês

- **Múltiplos chats por grupo** — usuário pediu threads distintos por contexto; descartado thread único por grupo. (origem: plan.md grill)
- **Params `:id` vs `:chatId`** — PATCH/DELETE usam id numérico interno; GET/recommendation usam UUID público — espelha conversas (`UserConversation` id vs chatId). (origem: inside-out HTTP)
- **Sem cota anônima** — chat de grupo exige membro autenticado; sem guest quota. (origem: spec REQ-7 + plan)
- **Membro removido do grupo** — chats persistem; ids ausentes no filtro são ignorados no exclude até próximo PATCH. (origem: spec edge case)
- **DELETE purge** — `PostgresChatThreadRepository` apaga `chatId` e `chatId:exclude:1..5` antes de remover metadados. (origem: spec REQ-3)

## Notas

- Consumidor UI: feature `group-recommendation-chat-ui` (aba Chat em `/social/groups/:id`).
- Listagem de membros para seletor: `GET /social/groups/:id/members` (`listagem-membros-grupo.md`).
- Sincronização MVP: polling no frontend — sem WebSocket.
