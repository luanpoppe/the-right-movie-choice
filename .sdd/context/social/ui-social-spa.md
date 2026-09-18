# UI social (frontend SPA)

> Atualizado em 2026-09-18 · fontes: `packages/frontend/src/features/social/**`, `SocialPage.tsx`, `GroupDetailPage.tsx`, `routes/index.tsx`, `Header.tsx`

## O que é

Área autenticada do SPA para amizades e grupos: rota `/social` com abas Friends, Requests e Groups, e detalhe do grupo em `/social/groups/:id`. Consome as APIs `/social/*` via `movieClient` (Bearer + refresh silencioso), no mesmo padrão de `ConversationsListPage` e `MyMoviesPage`.

## Como funciona

- **Rotas** (`routes/index.tsx`): `/social` → `SocialPage`; `/social/groups/:id` → `GroupDetailPage`.
- **Auth guard**: sem JWT, `SocialPage` e `GroupDetailPage` redirecionam para `/login?redirect=<path>` via `buildSocialLoginRedirect` (`social-login-redirect.utils.ts`).
- **Camadas**: DTOs Zod (`dto/`), services estáticos (`FriendshipService`, `UserGroupsService`), componentes de aba + forms, `SocialConfirmDialog` para ações destrutivas.
- **SocialPage**: Tabs Radix; aba Friends default; stubs substituídos por listas reais com fetch + `activeFetchIdRef` (troca rápida de aba ignora resposta obsoleta).
- **Friends**: lista amigos, `AddFriendForm` (POST friend-requests), remove com dialog.
- **Requests**: três seções (incoming/outgoing friends + group invites) carregadas em paralelo; mutações refresham listas.
- **Groups**: lista + `CreateGroupForm`; link para detalhe.
- **Detalhe do grupo**: sem `GET /groups/:id` no backend — monta metadados filtrando `UserGroupsService.listGroups()` pelo `:id`. Dono (`sub` do JWT decodificado localmente) edita/exclui/convida; membro sai. Sugestões via `listSuggestions`.
- **Header**: link "Social" só autenticado (`Header.tsx`).

## Decisões e porquês

- **Detalhe via listagem, não GET by id** — backend não expõe endpoint de detalhe; filtro client-side atende REQ-8. (origem: spec social-ui + edge case 2026-09-18)
- **`isOwner` pelo JWT `sub` no frontend** — `AuthContext` não expõe `userId`; decode local só para UI (autorização real no backend). (origem: F3.C11)
- **`activeFetchIdRef` em todas as abas com fetch** — mesmo padrão de `MyMoviesPage`; evita race ao trocar aba. (origem: spec edge case)
- **Toast genérico + mensagem 409 quando disponível** — REQ-12 + edge 409; helper duplicado em forms/detalhe (candidato a util único). (origem: spec)
- **Sem lista nominal de membros** — backend não lista membros; UI mostra só `memberCount`. (origem: spec edge case)

## Notas

- `group-detail-panel.tsx` concentra edição, convite, sugestões e dialogs — arquivo grande; candidato a split futuro.
- Services expõem métodos ainda sem tela (`searchUserByEmail`, `removeMember`, `cancelInvite`) — reservados para evolução.
- Erro parcial na aba Requests hoje derruba as três seções (`Promise.all`) — achado code review A1.
