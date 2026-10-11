# Spec: Chats e recomendação em grupo (API)

> Parte de [`group-recommendation-chat`](../../plan.md)

## Resumo

Expõe CRUD de chats por grupo (metadados + histórico compartilhado no checkpointer Postgres), PATCH do subconjunto de membros usado no filtro de assistidos e POST de recomendação reutilizando o pipeline `excludeWatched` com união multi-usuário. Só membros autenticados do grupo; sem cota anônima.

## Requirements

### REQ-1: Criar chat no grupo

- **Dado que** o usuário autenticado `id = 7` é membro do grupo `id = 3` (membros `7`, `12`, `15`)
- **Quando** envia `POST /social/groups/3/chats` com body `{}` ou `{ "title": "Sábado" }`
- **Então** retorna `201` com `{ id, groupId: 3, chatId, title, filterMemberUserIds, createdAt, updatedAt }`
- **E** `chatId` é UUID novo gerado pelo servidor
- **E** `filterMemberUserIds` inicia com `[7, 12, 15]` (todos os membros atuais)
- **E** `title` é o enviado ou `null` até o primeiro turno de recomendação

### REQ-2: Listar e abrir chats

- **Dado que** o grupo `id = 3` tem dois chats e o usuário `id = 7` é membro
- **Quando** envia `GET /social/groups/3/chats`
- **Então** retorna `200` com array ordenado por `updatedAt` descendente
- **Quando** envia `GET /social/groups/3/chats/:chatId` com `chatId` válido do grupo
- **Então** retorna `200` com metadados do chat
- **E** inclui `messages` lidos do checkpointer Postgres (mesmo shape de `GET /movie/conversations/:id`)

### REQ-3: Renomear e excluir chat

- **Dado que** o usuário `id = 12` é membro do grupo `id = 3` e existe chat `id = 40`
- **Quando** envia `PATCH /social/groups/3/chats/40` com `{ "title": "Terror leve" }`
- **Então** retorna `200` com título atualizado
- **Quando** envia `DELETE /social/groups/3/chats/40`
- **Então** retorna `204`
- **E** purga threads `chatId` e `chatId:exclude:{1..5}` no checkpointer antes de apagar metadados

### REQ-4: Atualizar filtro de assistidos

- **Dado que** o chat `id = 40` do grupo `3` tem `filterMemberUserIds = [7, 12, 15]`
- **Quando** o membro `id = 7` envia `PATCH /social/groups/3/chats/40/filter-members` com `{ "userIds": [7, 12] }`
- **Então** retorna `200` com `filterMemberUserIds = [7, 12]`
- **Erro** `userIds` contém `99` (não membro do grupo) → `400` com lista de ids inválidos

### REQ-5: Recomendação com exclude multi-usuário

- **Dado que** o membro `id = 7` abre o chat `chatId = "abc-uuid"` do grupo `3` com `filterMemberUserIds = [7, 12]`
- **Quando** envia `POST /social/groups/3/chats/abc-uuid/recommendation` com `{ "query": "comédia leve" }`
- **Então** retorna `200` com payload de recomendação (mesmo contrato de `POST /movie/recommendation`)
- **E** `excludeWatched` default `true` considera assistido se **qualquer** id em `filterMemberUserIds` marcou o filme como watched
- **E** atualiza `updatedAt` do chat após sucesso

### REQ-6: Apenas membros acessam

- **Dado que** o grupo `id = 3` existe e o usuário autenticado `id = 99` não é membro
- **Quando** envia qualquer rota `/social/groups/3/chats*` ou recommendation aninhada
- **Então** retorna `404`  ||  mesma resposta genérica das demais rotas de grupo

### REQ-7: JWT obrigatório

- **Entrada** `GET /social/groups/3/chats` sem JWT válido
- **Saída** `401`  ||  nenhuma leitura de chats do grupo

### REQ-8: Lookup de assistidos multi-usuário

- **Entrada** `filterMemberUserIds = [7, 12]`, candidatos TMDB `[550, 680]`, usuário `7` assistiu `550`, usuário `12` assistiu `680`
- **Saída** ambos `tmdbId` tratados como assistidos na tool e no sanitize final
- **Erro** lista vazia de `filterMemberUserIds` com `excludeWatched: true` → recommendation segue sem filtro de assistidos (modo padrão single-turn)

### REQ-9: Título automático no primeiro turno

- **Entrada** chat com `title = null`, recommendation bem-sucedida, gerador de título retorna `"Comédias leves"`
- **Saída** metadados passam a `title = "Comédias leves"`  ||  falha do gerador mantém `title = null` e recommendation ainda retorna `200`

## Edge cases

- Chat de grupo com um único membro → `filterMemberUserIds` default `[dono]`
- Membro sai ou é removido do grupo → chats persistem  ||  ids ausentes são ignorados no exclude até próximo PATCH
- `groupId` ou `chatId` inválido / chat de outro grupo → `404` genérico
- Checkpointer indisponível no `GET` com histórico → erro propagado (sem fallback silencioso)
- Listagem sem paginação no MVP (como conversas individuais)

## Contratos expostos

- **DTO/schemas:** `packages/backend/src/modules/social/infrastructure/http/dto/group-chats.dto.ts`
- **Mapper:** `packages/backend/src/modules/social/infrastructure/http/mappers/group-chats-response.mapper.ts:GroupChatsResponseMapper`
- **OpenAPI:** `packages/backend/src/modules/social/infrastructure/http/docs/group-chats.docs.ts`
- **Auth:** `packages/backend/src/domains/movies/infrastructure/http/hooks/user-movie-entry-auth.hook.ts:UserMovieEntryAuthHook` (mesmo hook de `/social/groups/*`)
- **Histórico:** `ChatHistoryEntitySchema` no GET — padrão `UserConversation` via `IChatHistoryRepository`
- **Recommendation pipeline:** `packages/backend/src/domains/movies/application/use-cases/get-movie-recommendation.use-case.ts:GetMovieRecommendationUseCase` com `filterUserIds[]`
- **Resposta recommendation:** `packages/backend/src/modules/social/infrastructure/http/dto/group-chats.dto.ts:GroupChatRecommendationResponseSchema` (alias de `MovieRecommendationResponseDTOSchema`)
