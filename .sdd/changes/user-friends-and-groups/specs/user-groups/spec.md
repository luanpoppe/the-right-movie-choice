# Spec: Grupos de usuários

> Parte de [`user-friends-and-groups`](../../plan.md)

## Resumo

API REST autenticada para grupos com dono e membros: criar, listar, convidar por e-mail (qualquer membro), aceitar/recusar/cancelar convites, sair, remover membro (dono), excluir grupo e sugerir amigos ainda fora do grupo. Amizade não é pré-requisito para entrar. Rotas sob `/social/groups/*` e `/social/group-invites/*`.

## Requirements

### REQ-1: Criar grupo

- **Dado que** o usuário autenticado `id = 7` envia `POST /social/groups` com `{ "name": "Sábado cinema", "description": "Filmes do fim de semana" }`
- **Quando** `name` é string não vazia (até 100 caracteres) e `description` é omitida ou string (até 500)
- **Então** retorna `201` com `{ id, name, description, ownerId: 7, createdAt, updatedAt }`
- **E** o usuário 7 passa a ser dono e membro do grupo

### REQ-2: Listar meus grupos

- **Dado que** o usuário `id = 7` é membro dos grupos `id = 3` e `id = 8`
- **Quando** envia `GET /social/groups`
- **Então** retorna `200` com array `{ id, name, description, ownerId, memberCount, joinedAt }`
- **E** inclui somente grupos em que 7 é membro

### REQ-3: Convidar por e-mail

- **Dado que** o usuário `id = 7` é membro do grupo `id = 3` e envia `POST /social/groups/3/invites` com `{ "email": "maria@example.com" }`
- **Quando** existe usuário `id = 12` com esse e-mail, 12 não é membro e não há convite `pending` para 12 no grupo 3
- **Então** retorna `201` com convite `{ id, groupId: 3, inviterId: 7, inviteeId: 12, status: "pending", createdAt }`

### REQ-4: Aceitar convite

- **Dado que** existe convite `pending` `id = 40` para `inviteeId = 12` no grupo `id = 3`
- **Quando** o usuário `id = 12` envia `POST /social/group-invites/40/accept`
- **Então** retorna `200` com `status: "accepted"`
- **E** 12 passa a ser membro do grupo 3

### REQ-5: Recusar convite

- **Dado que** existe convite `pending` `id = 40` para `inviteeId = 12`
- **Quando** o usuário `id = 12` envia `POST /social/group-invites/40/reject`
- **Então** retorna `200` com `status: "rejected"`
- **E** 12 não entra no grupo

### REQ-6: Cancelar convite enviado

- **Dado que** o convite `pending` `id = 41` foi enviado por `inviterId = 7`
- **Quando** o usuário `id = 7` envia `DELETE /social/group-invites/41`
- **Então** retorna `204`
- **E** o convite deixa de estar pendente

### REQ-7: Sair do grupo (membro)

- **Dado que** o usuário `id = 12` é membro não-dono do grupo `id = 3`
- **Quando** envia `DELETE /social/groups/3/members/me`
- **Então** retorna `204`
- **E** 12 deixa de ser membro do grupo 3

### REQ-8: Dono sai — transferência de ownership

- **Dado que** o usuário `id = 7` é dono do grupo `id = 3` com membros `7`, `12` (joinedAt mais antigo após 7) e `15`
- **Quando** 7 envia `DELETE /social/groups/3/members/me`
- **Então** retorna `204`
- **E** `ownerId` passa a ser `12`
- **E** 7 deixa de ser membro

### REQ-9: Dono remove membro

- **Dado que** o usuário `id = 7` é dono do grupo `id = 3` e `id = 15` é membro
- **Quando** 7 envia `DELETE /social/groups/3/members/15`
- **Então** retorna `204`
- **E** 15 deixa de ser membro

### REQ-10: Excluir grupo

- **Dado que** o usuário `id = 7` é dono do grupo `id = 3`
- **Quando** envia `DELETE /social/groups/3`
- **Então** retorna `204`
- **E** o grupo, membros e convites pendentes deixam de existir

### REQ-11: Sugerir amigos fora do grupo

- **Dado que** o usuário `id = 7` é membro do grupo `id = 3`, amigo aceito `id = 12`, e `id = 20` já é membro do grupo 3
- **Quando** envia `GET /social/groups/3/suggestions`
- **Então** retorna `200` com array `{ id, name, email }`
- **E** inclui 12 e exclui 7 (próprio usuário) e 20 (já membro)

### REQ-12: Listar convites recebidos

- **Dado que** o usuário `id = 12` tem convites `pending` para os grupos `3` e `5`
- **Quando** envia `GET /social/group-invites/incoming`
- **Então** retorna `200` com array `{ id, group: { id, name }, inviter: { id, name, email }, status, createdAt }`

### REQ-13: Reenvio após recusa

- **Entrada** convite anterior de 7 para 12 no grupo 3 está `rejected`
- **Quando** 7 envia novo convite para `maria@example.com` (usuário 12)
- **Saída** cria novo convite `pending` com `201`

### REQ-14: Acesso autenticado

- **Entrada** qualquer rota `/social/groups/*` ou `/social/group-invites/*` sem JWT válido
- **Saída** `401`  ||  nenhuma leitura/escrita de grupo

### REQ-15: Isolamento por usuário

- **Entrada** convite `id = 40` pertence a `inviteeId = 12`
- **Saída** aceitar/recusar/cancelar com JWT de outro usuário → `404`  ||  não expõe nem altera dados alheios

## Edge cases

- Convidar e-mail inexistente → `404`
- Convidar a si mesmo → `400`
- Convidar membro existente ou convite `pending` duplicado no mesmo grupo → `409`
- Usuário não-membro tenta convidar ou ver sugestões → `404`
- Não-dono tenta excluir grupo ou remover membro → `404`
- Dono único sai do grupo → grupo dissolvido (mesmo efeito de DELETE grupo)
- Grupo atinge limite de 100 membros → `409` ao aceitar convite ou convidar
- Concorrência em aceite duplo do mesmo convite → um membro único  ||  sem duplicata

## Contratos expostos

- Rotas novas sob `/social/groups/*` e `/social/group-invites/*` (a definir em `packages/backend/src/modules/social/infrastructure/http/controllers/routes.ts`)
- DTOs Zod: `packages/backend/src/modules/social/infrastructure/http/dto/user-groups.dto.ts` (provisório)
- Auth JWT: reutilizar `UserMovieEntryAuthHook`
- Descoberta por e-mail: reutilizar `IUserRepository.findByEmailCaseInsensitive`
- Sugestões: reutilizar `IFriendRequestRepository` / listagem de amigos aceitos da feature friendship
