# Sidebar de conversas (frontend SPA)

> Atualizado em 2026-09-16 · fontes: `packages/frontend/src/features/conversations/**`, `ConversationsListPage`, `ConversationChatPage`, `Home.tsx`, `Header.tsx`, `routes/index.tsx`

## O que é

Navegação de histórico de conversas para usuários autenticados no SPA: listagem em `/conversations`, chat com sidebar em `/conversations/:id`, e Home focada em iniciar nova conversa (sem sidebar). Guests mantêm fluxo atual na Home sem listagem nem sidebar.

## Como funciona

- **Home (`/`)**: logado vê só `Welcome`; primeira mensagem chama `POST /movie/conversations`, depois `POST /movie/recommendation` com `chatId` retornado, e navega para `/conversations/:id`. Guest mantém `chatId` local, lock de cota e chat inline.
- **Listagem (`/conversations`)**: `UserConversationService.listConversations`, CRUD inline via `ConversationListItem` + `ConversationDeleteDialog`.
- **Chat (`/conversations/:id`)**: `GET /movie/conversations/:id` → `ChatHistoryMapperUtils` → `useConversationChat` + `ConversationSidebar` + `Chat` dentro de `UserMovieEntriesProvider`.
- **Header**: link "Conversations" só com JWT.
- **Título null**: `ConversationTitleUtils` formata `"New Conversation · {relative time}"` (date-fns, enUS).

## Decisões e porquês

- **Sidebar só em `/conversations/:id`, não na Home** — diverge do plan.md original; spec refinada com usuário (REQ-1). Home é ponto de entrada; histórico navega para rota dedicada.
- **Hook `useConversationChat` compartilhado** — lógica de recommendation + `sidebarRefreshKey` reutilizada entre chat page e futuras extensões; Home autenticada tem fluxo próprio (create + navigate).
- **404 em GET conversa → `/conversations`** — REQ-10; sem toast para not-found.
- **Delete da conversa ativa → `/`** — REQ-7; estado Welcome na Home.
- **`ChatHistoryEntity` é `[role, string]`** — movies dos cards não persistem no histórico do checkpointer hoje; mensagens retomadas mostram só texto (limitação conhecida, ver code review A1).

## Notas

- Utils de lista (`sortByUpdatedAtDesc`, etc.) duplicados entre `ConversationsListPage` e `ConversationSidebar` — candidato a extração futura.
- Refresh da sidebar após cada turno via `sidebarRefreshKey` incrementado no hook.
