# Listagem de membros do grupo (API)

> Atualizado em 2026-09-18 · fontes: `list-group-members.use-case.ts`, `prisma-user-group.repository.ts`, rotas `/social/groups/:id/members`

## O que é

Endpoint autenticado para um membro do grupo listar os integrantes com `id`, `name` e `email`, ordenados por nome. Alimenta o seletor de filtro de assistidos nas features de chat de grupo.

## Como funciona

- **GET** `/social/groups/:id/members` — mesmo `preHandler` JWT das demais rotas `/social/groups/*` (`UserMovieEntryAuthHook`).
- **Controller** `listGroupMembers` → **use case** `ListGroupMembersUseCase`: valida grupo (`findById`), membership (`findMembership`), depois `findMemberProfiles(groupId)`.
- **Repositório** `findMemberProfiles`: join `GroupMember` → `User`, `orderBy user.name asc`, mapeia `UserPublicEntity` (shape igual amizades).
- **Resposta HTTP**: array `UserPublicSchema` via `toListGroupMembersResponse` (reusa mapper de sugestão de amigos).

## Decisões e porquês

- **404 genérico** para grupo inexistente e não-membro — mesma mensagem das rotas de grupo; não vaza existência. (origem: spec REQ-2/REQ-5 + padrão `grupos-api.md`)
- **Sem paginação no MVP** — grupos limitados a 100 membros; lista completa em uma resposta. (origem: spec edge case)
- **Ordem por `name asc` no Prisma** — collation do Postgres; locale-insensitive implícito, sem `LOWER` explícito. (origem: spec REQ-1)
- **Três queries no use case** (`findById`, `findMembership`, `findMemberProfiles`) — aceitável no MVP; trade-off de clareza vs join único. (origem: inside-out + review A10)

## Notas

- Não expõe `findMemberUserIds` sozinho — perfis completos exigem join com `User`.
- Próximo consumidor: UI do seletor de membros no chat de grupo (`group-recommendation-chat-ui`).
