# Tasks: social-ui

> Parte de [`user-friends-and-groups`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F3.C<m>` (feature UI social).

## Chunks

### F3.C1 — DTOs de amizade (Zod)

Metadados:
- **Arquivos**: `packages/frontend/src/features/social/dto/friendship.dto.ts`, `packages/frontend/src/features/social/dto/specs/friendship.dto.spec.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `friendship.dto.ts` → 2) `friendship.dto.spec.ts`

- [x] **Faz**: Schemas Zod espelhando respostas `/social/friends*` e `/social/friend-requests*` + search user.
- [x] **Validação**: `cd packages/frontend && pnpm exec jest src/features/social/dto/specs/friendship.dto.spec.ts && pnpm exec eslint --fix src/features/social/dto/friendship.dto.ts src/features/social/dto/specs/friendship.dto.spec.ts`

### F3.C2 — DTOs de grupos (Zod)

Metadados:
- **Arquivos**: `packages/frontend/src/features/social/dto/user-groups.dto.ts`, `packages/frontend/src/features/social/dto/specs/user-groups.dto.spec.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `user-groups.dto.ts` → 2) spec

- [x] **Faz**: Schemas Zod para grupos, convites e sugestões (`/social/groups*`, `/social/group-invites*`).
- [x] **Validação**: `cd packages/frontend && pnpm exec jest src/features/social/dto/specs/user-groups.dto.spec.ts && pnpm exec eslint --fix src/features/social/dto/user-groups.dto.ts src/features/social/dto/specs/user-groups.dto.spec.ts`

### F3.C3 — Dialog de confirmação + util de redirect

Metadados:
- **Arquivos**: `packages/frontend/src/features/social/components/social-confirm-dialog.tsx`, `packages/frontend/src/features/social/utils/social-login-redirect.utils.ts`, `packages/frontend/src/features/social/utils/specs/social-login-redirect.utils.spec.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `social-login-redirect.utils.ts` → 2) spec → 3) `social-confirm-dialog.tsx`

- [x] **Faz**: Dialog reutilizável (Radix) para ações destrutivas e helper `buildSocialLoginRedirect(path)` espelhando `/conversations`.
- [x] **Validação**: `cd packages/frontend && pnpm exec jest src/features/social/utils/specs/social-login-redirect.utils.spec.ts && pnpm exec eslint --fix src/features/social/components/social-confirm-dialog.tsx src/features/social/utils/social-login-redirect.utils.ts`

### F3.C4 — FriendshipService

Metadados:
- **Arquivos**: `packages/frontend/src/features/social/services/friendship.service.ts`, `packages/frontend/src/features/social/services/specs/friendship.service.spec.ts`
- **Depende de**: F3.C1
- **Ordem de revisão**: 1) service → 2) spec

- [x] **Faz**: Classe estática chamando `movieClient` para friends, friend-requests e search by email.
- [x] **Validação**: `cd packages/frontend && pnpm exec jest src/features/social/services/specs/friendship.service.spec.ts && pnpm exec eslint --fix src/features/social/services/friendship.service.ts`

### F3.C5 — UserGroupsService

Metadados:
- **Arquivos**: `packages/frontend/src/features/social/services/user-groups.service.ts`, `packages/frontend/src/features/social/services/specs/user-groups.service.spec.ts`
- **Depende de**: F3.C2
- **Ordem de revisão**: 1) service → 2) spec

- [x] **Faz**: Classe estática para CRUD de grupos, convites, suggestions e leave/delete.
- [x] **Validação**: `cd packages/frontend && pnpm exec jest src/features/social/services/specs/user-groups.service.spec.ts && pnpm exec eslint --fix src/features/social/services/user-groups.service.ts`

### F3.C6 — Rotas SPA + link no header

Metadados:
- **Arquivos**: `packages/frontend/src/routes/index.tsx`, `packages/frontend/src/layouts/Header.tsx`, `packages/frontend/src/layouts/specs/Header.spec.tsx`
- **Depende de**: F3.C4, F3.C5
- **Ordem de revisão**: 1) routes → 2) Header → 3) Header spec

- [x] **Faz**: Registra `/social` e `/social/groups/:id`; link Social no header autenticado; atualiza teste do header.
- [x] **Validação**: `cd packages/frontend && pnpm exec jest src/layouts/specs/Header.spec.ts && pnpm exec eslint --fix src/routes/index.tsx src/layouts/Header.tsx`

### F3.C7 — SocialPage shell com abas (stubs)

Metadados:
- **Arquivos**: `packages/frontend/src/pages/SocialPage.tsx`, `packages/frontend/src/pages/GroupDetailPage.tsx`, `packages/frontend/src/features/social/components/friends-tab.tsx`, `packages/frontend/src/features/social/components/requests-tab.tsx`, `packages/frontend/src/features/social/components/groups-tab.tsx`
- **Depende de**: F3.C3, F3.C6
- **Ordem de revisão**: 1) SocialPage → 2) GroupDetailPage stub → 3) tab stubs

- [x] **Faz**: Página `/social` com Tabs Friends/Requests/Groups importando componentes stub; página detalhe com auth guard e redirect; stubs exportam placeholder.
- [x] **Validação**: `cd packages/frontend && pnpm exec eslint --fix src/pages/SocialPage.tsx src/pages/GroupDetailPage.tsx src/features/social/components/friends-tab.tsx src/features/social/components/requests-tab.tsx src/features/social/components/groups-tab.tsx`

### F3.C8 — Aba Friends

Metadados:
- **Arquivos**: `packages/frontend/src/features/social/components/friends-tab.tsx`, `packages/frontend/src/features/social/components/add-friend-form.tsx`, `packages/frontend/src/features/social/components/specs/friends-tab.spec.tsx`
- **Depende de**: F3.C4, F3.C7
- **Ordem de revisão**: 1) add-friend-form → 2) friends-tab → 3) spec

- [x] **Faz**: Lista amigos, busca/envia solicitação, desfazer amizade com SocialConfirmDialog e toasts.
- [x] **Validação**: `cd packages/frontend && pnpm exec jest src/features/social/components/specs/friends-tab.spec.tsx && pnpm exec eslint --fix src/features/social/components/friends-tab.tsx src/features/social/components/add-friend-form.tsx`

### F3.C9 — Aba Requests

Metadados:
- **Arquivos**: `packages/frontend/src/features/social/components/requests-tab.tsx`, `packages/frontend/src/features/social/components/specs/requests-tab.spec.tsx`
- **Depende de**: F3.C4, F3.C5, F3.C7
- **Ordem de revisão**: 1) requests-tab → 2) spec

- [x] **Faz**: Seções Incoming/Outgoing friends + Group invites com ações accept/reject/cancel.
- [x] **Validação**: `cd packages/frontend && pnpm exec jest src/features/social/components/specs/requests-tab.spec.tsx && pnpm exec eslint --fix src/features/social/components/requests-tab.tsx`

### F3.C10 — Aba Groups

Metadados:
- **Arquivos**: `packages/frontend/src/features/social/components/groups-tab.tsx`, `packages/frontend/src/features/social/components/create-group-form.tsx`, `packages/frontend/src/features/social/components/specs/groups-tab.spec.tsx`
- **Depende de**: F3.C5, F3.C7
- **Ordem de revisão**: 1) create-group-form → 2) groups-tab → 3) spec

- [x] **Faz**: Lista grupos, criar grupo, navegar para detalhe; empty states e toasts.
- [x] **Validação**: `cd packages/frontend && pnpm exec jest src/features/social/components/specs/groups-tab.spec.tsx && pnpm exec eslint --fix src/features/social/components/groups-tab.tsx src/features/social/components/create-group-form.tsx`

### F3.C11 — Página de detalhe do grupo

Metadados:
- **Arquivos**: `packages/frontend/src/pages/GroupDetailPage.tsx`, `packages/frontend/src/features/social/components/group-detail-panel.tsx`, `packages/frontend/src/pages/specs/group-detail-page.spec.tsx`
- **Depende de**: F3.C5, F3.C7
- **Ordem de revisão**: 1) group-detail-panel → 2) GroupDetailPage → 3) spec

- [x] **Faz**: Detalhe via listagem filtrada; editar (dono), convidar, sugestões, sair/excluir com confirmação; not found.
- [x] **Validação**: `cd packages/frontend && pnpm exec jest src/pages/specs/group-detail-page.spec.tsx && pnpm exec eslint --fix src/pages/GroupDetailPage.tsx src/features/social/components/group-detail-panel.tsx`
