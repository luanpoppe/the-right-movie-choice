# Spec: UI do chat de grupo

> Parte de [`group-recommendation-chat`](../../plan.md)

## Resumo

Aba **Chat** no detalhe do grupo (`/social/groups/:id`) com CRUD de chats, conversa compartilhada e seletor de membros para filtro de assistidos. Reutiliza componentes de chat/conversas do SPA e consome `/social/groups/:groupId/chats*`.

## Requirements

### REQ-1: Abas Detalhes e Chat no grupo

- **Dado que** o usuário autenticado é membro do grupo `id = 3`
- **Quando** abre `/social/groups/3`
- **Então** vê tabs **Detalhes** (conteúdo atual do painel) e **Chat**
- **E** a aba **Chat** mostra a lista de chats do grupo

### REQ-2: Criar chat e listar

- **Dado que** o membro está na aba **Chat** do grupo `3`
- **Quando** clica em criar novo chat
- **Então** chama `POST /social/groups/3/chats` e navega para o chat criado
- **E** a lista ordena por `updatedAt` descendente (como a API)

### REQ-3: Abrir conversa com sidebar

- **Dado que** o grupo `3` tem chat `chatId = "550e8400-e29b-41d4-a716-446655440000"`
- **Quando** o membro abre esse chat
- **Então** navega para `/social/groups/3/chats/550e8400-e29b-41d4-a716-446655440000`
- **E** a tela exibe sidebar com lista de chats do grupo e área de conversa (padrão `ConversationChatPage`)
- **E** carrega mensagens via `GET /social/groups/3/chats/:chatId`

### REQ-4: Enviar recomendação no chat

- **Dado que** o membro está no chat aberto do grupo `3`
- **Quando** envia a query `"comédia leve"` no formulário do chat
- **Então** chama `POST /social/groups/3/chats/:chatId/recommendation` com `{ "query": "comédia leve" }`
- **E** exibe resposta da IA e cards de filmes no histórico local
- **E** não exibe toggle pessoal `excludeWatched`  ||  o filtro vem de `filterMemberUserIds` do chat

### REQ-5: Polling de mensagens compartilhadas

- **Entrada** chat aberto em `/social/groups/3/chats/:chatId`
- **Saída** refetch periódico do `GET` chat a cada `5000` ms enquanto a rota permanece montada
- **E** refetch imediato após recomendação local bem-sucedida
- **Erro** falha de polling → toast genérico  ||  mantém último histórico válido na tela

### REQ-6: Configurar filtro de assistidos

- **Dado que** o chat tem `filterMemberUserIds = [7, 12, 15]`
- **Quando** o membro abre o dialog **Filtro de assistidos**, desmarca `15`, usa atalho **Selecionar todos** ou salva
- **Então** chama `PATCH /social/groups/3/chats/:id/filter-members` com `{ "userIds": [...] }`
- **E** atualiza o estado exibido do chat após `200`

### REQ-7: Renomear e excluir chat

- **Dado que** existe chat `id = 40` na lista do grupo `3`
- **Quando** o membro renomeia inline para `"Terror leve"`
- **Então** chama `PATCH /social/groups/3/chats/40` e atualiza a lista
- **Quando** confirma exclusão no dialog destrutivo
- **Então** chama `DELETE /social/groups/3/chats/40`
- **E** se era o chat ativo, volta para a lista na aba **Chat**

### REQ-8: Erros e redirecionamentos

- **Entrada** `GET` chat retorna `404` (chat inexistente ou sem permissão)
- **Saída** navega para `/social/groups/3` com aba **Chat** ativa  ||  sem toast (padrão conversas)
- **Erro** usuário não autenticado em rota de chat → redirect `/login?redirect=<path>`

### REQ-9: Título provisório

- **Entrada** chat com `title: null` e `updatedAt` conhecido
- **Saída** lista/sidebar exibe rótulo no padrão `"New Conversation · {relative time}"`  ||  reutiliza `ConversationTitleUtils`

## Edge cases

- Lista vazia na aba **Chat** → estado vazio com CTA criar primeiro chat
- Troca rápida de aba/rota → respostas obsoletas ignoradas via `activeFetchIdRef` (padrão social/conversas)
- Outro membro envia turno durante polling → histórico atualiza no próximo ciclo ou refetch pós-envio
- `filterMemberUserIds: []` após salvar dialog → UI reflete array vazio  ||  sem exclude multi-usuário (REQ-8 da API)

## Contratos expostos

- **Service (novo):** `packages/frontend/src/features/social/services/group-chats.service.ts` — métodos espelhando rotas `/social/groups/:groupId/chats*`
- **DTO (novo):** `packages/frontend/src/features/social/dto/group-chats.dto.ts` — espelha `packages/backend/src/modules/social/infrastructure/http/dto/group-chats.dto.ts`
- **Rotas:** `packages/frontend/src/routes/index.tsx:routers` — child route `social/groups/:groupId/chats/:chatId` → `GroupChatPage`
- **API backend:** contratos em `.sdd/context/social/chats-recomendacao-grupo-api.md` e `group-chats.dto.ts`
- **Membros para seletor:** `GET /social/groups/:id/members` via `UserGroupsService` ou service dedicado já existente
