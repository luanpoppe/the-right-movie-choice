# UI do chat de recomendação em grupo (frontend SPA)

> Atualizado em 2026-09-19 · fontes: `packages/frontend/src/features/social/**`, `GroupChatPage.tsx`, `group-chats-tab.tsx`, `use-group-chat.ts`, `routes/index.tsx`

## O que é

Aba **Chat** no detalhe do grupo (`/social/groups/:id`) com CRUD de chats e sub-rota de conversa compartilhada (`/social/groups/:groupId/chats/:chatId`). Espelha o padrão de conversas individuais (`ConversationChatPage` + sidebar), sem toggle pessoal `excludeWatched` — o filtro de assistidos vem de `filterMemberUserIds` configurável por chat.

## Como funciona

- **Rotas** (`routes/index.tsx`): sub-rota `social/groups/:groupId/chats/:chatId` → `GroupChatPage` (registrada antes de `social/groups/:id`); detalhe do grupo mantém abas Details | Chat via `GroupDetailTabs`.
- **Aba Chat** (`group-chats-tab.tsx`): lista chats do grupo, criar/renomear/excluir inline, navega para sub-rota ao abrir.
- **Página de chat** (`GroupChatPage.tsx`): auth guard → `GET` inicial via `GroupChatsService.getByChatId` → `useGroupChat` (polling 5s + POST recommendation) + `GroupChatSidebar` + `Chat` + botão/dialog de filtro (`GroupChatFilterMembersDialog`).
- **Hook** (`use-group-chat.ts`): POST recommendation, refetch após envio, polling `GROUP_CHAT_POLLING_INTERVAL_MS` (5000), `sidebarRefreshKey`, `activeFetchIdRef` para fetches obsoletos.
- **Sidebar** (`group-chat-sidebar.tsx` + `group-chat-list-item.tsx`): lista lateral na sub-rota, CRUD inline, rota ativa por UUID `chatId`.
- **Filtro assistidos** (`group-chat-filter-members-dialog.tsx`): checklist de membros via `UserGroupsService.listMembers`, PATCH `filterMemberUserIds`.
- **Utils** (`group-chat-list.utils.ts`): ordenação `updatedAt` desc, título provisório delega `ConversationTitleUtils`.
- **HTTP** (`group-chats.service.ts` + DTOs Zod): espelha API `/social/groups/:groupId/chats*`.

## Decisões e porquês

- **Sub-rota dedicada com sidebar** — REQ-3 alinha com `ConversationChatPage`; Home/grupo não misturam conversa inline. (origem: spec UI 2026-09-19)
- **Sem toggle `excludeWatched` no chat** — REQ-4: filtro multi-usuário só via dialog de membros; `Chat` recebe `hasAccessToken={false}` para ocultar toggle. (origem: spec UI)
- **404 silencioso → detalhe do grupo aba Chat** — `Navigate` com `state: { tab: 'chat' }`; `GroupDetailTabs` lê `location.state.tab`. (origem: REQ-8, F3.C7)
- **Page fetch + hook polling** — page faz bootstrap inicial; hook compensa ausência de fetch no mount com `refetch()` e polling — diverge levemente de `ConversationChatPage` (1 GET só na page). (origem: F3.C5 + F3.C7)
- **Params inválidos → `/social`** — não há rota `/social/groups` isolada; cai na listagem social. (origem: implementação F3.C7)

## Notas

- ~~Duplicação parcial de item de lista entre `group-chats-tab.tsx` e `group-chat-list-item.tsx`~~ — resolvido: aba reutiliza `GroupChatListItem` (code review A5, 2026-09-19).
- ~~`useGroupChat` trata 404 de polling com toast~~ — resolvido: callback `onChatNotFound` redireciona silenciosamente (A3).
- ~~Salvar filtro regredia mensagens~~ — resolvido: effect do hook não reseta messages em PATCH de filtro (A1).
