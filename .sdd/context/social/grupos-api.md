# Grupos de usuários (API backend)

> Atualizado em 2026-09-17 · fontes: `packages/backend/src/modules/social/**`, `packages/backend/prisma/schema.prisma`

## O que é

API REST autenticada para grupos com dono e membros: criar, listar, editar (dono), convidar por e-mail (qualquer membro), aceitar/recusar/cancelar convites, sair, remover membro (dono), excluir grupo e sugerir amigos ainda fora do grupo. Amizade não é pré-requisito para entrar. Rotas sob `/social/groups/*` e `/social/group-invites/*`.

## Como funciona

- **Domínio** (`modules/social/domain`): entidades `UserGroup`, `GroupMember`, `GroupInvite`; `UserGroupValidationUtils` (name/description, e-mail, limite 100 membros); portas `IUserGroupRepository` e `IGroupInviteRepository`; exceções 400/404/409 espelhando amizades.
- **Persistência**: tabelas `UserGroup`, `GroupMember`, `GroupInvite` com `GroupInviteStatus` enum; CASCADE ao deletar grupo; `createWithOwner` transacional.
- **Use cases**: CRUD de grupo; convites (send/accept/reject/cancel/list incoming); membros (leave com transferência/dissolução, remove pelo dono, suggest friends via `IFriendRequestRepository.listAcceptedFriends`).
- **HTTP**: `MakeUserGroupsHttpFactory` + `UserGroupsController` + rotas em `socialControllers`; JWT via `UserMovieEntryAuthHook` (mesmo hook de amizades).

## Decisões e porquês

- **404 genérico para não-membro / não-dono** — espelha amizades e REQ-15; não vaza existência do grupo. (origem: spec + contexto amizades)
- **Cancelar convite = DELETE** — hard delete do pending; reject = UPDATE status. (origem: spec REQ-5/6)
- **Dono único sai → dissolve grupo** — mesmo efeito de DELETE grupo (edge case spec). (origem: leave-user-group use case)
- **Transferência de ownership ao sair** — membro com `joinedAt` mais antigo após o dono vira novo owner (REQ-8). (origem: `findOldestMemberAfterOwner`)
- **Dedupe de convite pending na app** — sem partial unique index; trade-off igual amizades, com risco de race. (origem: grill F2.C3)
- **Aceite e convite atômicos** — `acceptPendingAndAddMember` e `createPendingIfAvailable` no Prisma usam `$transaction` (count + status + member/create). (origem: correção code review fechamento F2)
- **Limite 100 no send e no accept** — ambos checam count dentro da transação; convite a grupo cheio retorna 409. (origem: spec edge case + A5)
- **Dono não se remove via DELETE member** — use `leave`; remove-member lança 404 genérico. (origem: A3)
- **Saída do dono com transferência atômica** — `leaveAsOwnerWithTransfer` em uma transação. (origem: A4/A8)

## Notas

- Sugestões de amigos: loop com `findMembership` por amigo (N+1 aceitável no MVP; A7 no review).
- Reenvio após `rejected`: `hasPendingInvite` ignora rejected; novo pending permitido (REQ-13).
- **Listagem de membros** (`GET /social/groups/:id/members`): ver [listagem-membros-grupo.md](listagem-membros-grupo.md).
- Próxima feature desta mudança: chat de recomendação em grupo (`group-recommendation-chat-api` / UI).
- Contratos: `specs/user-groups/spec.md` seção "Contratos expostos".
