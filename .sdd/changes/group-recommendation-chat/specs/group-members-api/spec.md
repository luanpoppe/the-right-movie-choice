# Spec: Membros do grupo (API)

> Parte de [`group-recommendation-chat`](../../plan.md)

## Resumo

Expõe `GET /social/groups/:id/members` para membros autenticados listarem os demais integrantes do grupo com `id`, `name` e `email`, ordenados por nome. Alimenta o seletor de filtro de assistidos nas features seguintes.

## Requirements

### REQ-1: Listar membros do grupo

- **Dado que** o usuário autenticado `id = 7` é membro do grupo `id = 3`, cujo integrantes são `7`, `12` e `15`
- **Quando** envia `GET /social/groups/3/members`
- **Então** retorna `200` com array de `{ id, name, email }`
- **E** inclui os três usuários
- **E** a ordem é `name` ascendente (locale-insensitive no banco)

### REQ-2: Apenas membros acessam

- **Dado que** o grupo `id = 3` existe e o usuário autenticado `id = 99` não é membro
- **Quando** envia `GET /social/groups/3/members`
- **Então** retorna `404`  ||  mesma resposta genérica das demais rotas de grupo para não-membro

### REQ-3: JWT obrigatório

- **Entrada** `GET /social/groups/3/members` sem JWT válido
- **Saída** `401`  ||  nenhuma leitura de membros

### REQ-4: Resolução de perfis

- **Entrada** grupo `id = 3` com `GroupMember` para `userId` `[7, 12]`
- **Saída** join com `User` retorna `{ id: 7, name, email }` e `{ id: 12, name, email }`  ||  reutiliza shape `UserPublic` da feature friendship
- **Erro** membro apontando para `User` inexistente → não ocorre em operação normal  ||  se ocorrer, omitir ou falhar de forma segura no repositório (decisão de implementação; lista nunca retorna linha sem `id`)

### REQ-5: Grupo inexistente

- **Dado que** não existe grupo `id = 999`
- **Quando** o usuário autenticado `id = 7` envia `GET /social/groups/999/members`
- **Então** retorna `404`  ||  mesmo tratamento de REQ-2 (não vaza existência)

## Edge cases

- Grupo com um único membro (dono) → `200` com array de 1 item
- Grupo no limite de 100 membros → `200` com até 100 itens  ||  sem paginação no MVP
- `id` de grupo inválido (não inteiro positivo) → `400`

## Contratos expostos

- **Rota:** `packages/backend/src/modules/social/infrastructure/http/controllers/routes.ts` — `GET /social/groups/:id/members` via `ListGroupMembersDocs` e `userGroupsHttp.handlers.listGroupMembers`
- **Auth:** `packages/backend/src/domains/movies/infrastructure/http/hooks/user-movie-entry-auth.hook.ts:UserMovieEntryAuthHook` (mesmo `preHandler` das rotas `/social/groups/*`)
- **DTO:** `packages/backend/src/modules/social/infrastructure/http/dto/user-groups.dto.ts:ListGroupMembersResponseSchema` (reutiliza `UserPublicSchema`)
- **Mapper:** `packages/backend/src/modules/social/infrastructure/http/mappers/user-groups-response.mapper.ts:toListGroupMembersResponse`
- **Use case:** `packages/backend/src/modules/social/application/use-cases/list-group-members.use-case.ts:ListGroupMembersUseCase`
- **Repositório:** `packages/backend/src/modules/social/domain/repositories/user-group.repository.ts:findMemberProfiles`
