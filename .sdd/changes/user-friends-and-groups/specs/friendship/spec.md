# Spec: Amizades

> Parte de [`user-friends-and-groups`](../../plan.md)

## Resumo

Expõe API REST autenticada para amizades bilaterais: enviar, aceitar, recusar e cancelar solicitações; listar amigos e pendentes (recebidas/enviadas); buscar usuário por e-mail com status da relação; desfazer amizade. Rotas sob `/social/*`. Reutiliza JWT existente e `IUserRepository.findByEmail` para descoberta.

## Requirements

### REQ-1: Enviar solicitação de amizade

- **Dado que** o usuário autenticado `id = 7` envia `POST /social/friend-requests` com body `{ "email": "maria@example.com" }`
- **Quando** existe usuário com esse e-mail (`id = 12`) e ainda não há amizade nem solicitação pendente entre 7 e 12
- **Então** retorna `201` com a solicitação criada (`id`, `requesterId`, `addresseeId`, `status: "pending"`, timestamps)
- **E** `requesterId = 7` e `addresseeId = 12`

### REQ-2: Aceitar solicitação recebida

- **Dado que** existe solicitação pendente `id = 55` de `requesterId = 12` para `addresseeId = 7`
- **Quando** o usuário `id = 7` envia `POST /social/friend-requests/55/accept`
- **Então** retorna `200` com `status: "accepted"`
- **E** a relação passa a contar como amizade ativa entre 7 e 12

### REQ-3: Recusar solicitação recebida

- **Dado que** existe solicitação pendente `id = 55` de `requesterId = 12` para `addresseeId = 7`
- **Quando** o usuário `id = 7` envia `POST /social/friend-requests/55/reject`
- **Então** retorna `200` com `status: "rejected"`
- **E** não há amizade ativa entre 7 e 12

### REQ-4: Cancelar solicitação enviada

- **Dado que** existe solicitação pendente `id = 56` de `requesterId = 7` para `addresseeId = 15`
- **Quando** o usuário `id = 7` envia `DELETE /social/friend-requests/56`
- **Então** retorna `204`
- **E** a solicitação deixa de existir como pendente

### REQ-5: Desfazer amizade

- **Dado que** os usuários `id = 7` e `id = 12` são amigos aceitos
- **Quando** o usuário `id = 7` envia `DELETE /social/friends/12`
- **Então** retorna `204`
- **E** não há mais amizade ativa entre 7 e 12

### REQ-6: Listar amigos

- **Dado que** o usuário `id = 7` tem amizades aceitas com `id = 12` e `id = 15`
- **Quando** envia `GET /social/friends` com JWT válido
- **Então** retorna `200` com array de usuários `{ id, name, email }`
- **E** inclui somente amigos do usuário 7
- **E** não inclui solicitações pendentes ou recusadas

### REQ-7: Listar solicitações recebidas

- **Dado que** o usuário `id = 7` tem solicitações pendentes de `id = 12` e `id = 20`
- **Quando** envia `GET /social/friend-requests/incoming`
- **Então** retorna `200` com array de itens `{ id, requester: { id, name, email }, status, createdAt }`
- **E** inclui somente pendentes onde `addresseeId = 7`

### REQ-8: Listar solicitações enviadas

- **Dado que** o usuário `id = 7` enviou solicitações pendentes para `id = 15` e `id = 18`
- **Quando** envia `GET /social/friend-requests/outgoing`
- **Então** retorna `200` com array de itens `{ id, addressee: { id, name, email }, status, createdAt }`
- **E** inclui somente pendentes onde `requesterId = 7`

### REQ-9: Buscar usuário por e-mail

- **Dado que** o usuário autenticado `id = 7` consulta `GET /social/users/search?email=maria@example.com`
- **Quando** existe usuário `id = 12` com esse e-mail
- **Então** retorna `200` com `{ id, name, email, relationshipStatus }`
- **E** `relationshipStatus` é um de: `"none"`, `"friends"`, `"pending_outgoing"`, `"pending_incoming"`, `"rejected"`
- **E** nunca retorna o próprio usuário 7 como resultado

### REQ-10: Auto-aceite em solicitações cruzadas

- **Entrada** usuário `id = 7` envia solicitação para `id = 12` enquanto já existe solicitação pendente de `12` para `7`
- **Saída** a relação resultante é amizade aceita imediatamente (`status: "accepted"`)
- **E** não permanecem duas solicitações pendentes opostas

### REQ-11: Reenvio após recusa

- **Entrada** solicitação anterior de `7` para `12` está `rejected`
- **Quando** `7` envia nova solicitação para `12`
- **Saída** cria nova solicitação `pending` com `201`

### REQ-12: Acesso autenticado

- **Entrada** qualquer rota `/social/*` sem JWT válido
- **Saída** `401`  ||  nenhuma leitura/escrita de amizade

### REQ-13: Isolamento por usuário

- **Entrada** solicitação `id = 55` pertence a `addresseeId = 7`
- **Saída** aceitar/recusar/cancelar com JWT de outro usuário → `404`  ||  não expõe nem altera dados alheios

## Edge cases

- Enviar solicitação para e-mail inexistente → `404`
- Enviar solicitação para o próprio e-mail/usuário → `400`
- Enviar solicitação quando já são amigos → `409`
- Enviar solicitação quando já existe pendente na mesma direção → `409`
- Busca por e-mail inexistente → `404`
- E-mail inválido ou ausente na busca/envio → `400`
- Concorrência em auto-aceite cruzado → resultado final único `accepted`  ||  sem duplicata de amizade

## Contratos expostos

- `POST /social/friend-requests` — body `{ email: string }`  ||  `201` solicitação  ||  auth JWT
- `POST /social/friend-requests/:id/accept` — `200` solicitação aceita
- `POST /social/friend-requests/:id/reject` — `200` solicitação recusada
- `DELETE /social/friend-requests/:id` — `204` cancela pendente enviada pelo autenticado
- `DELETE /social/friends/:userId` — `204` remove amizade
- `GET /social/friends` — `200` `{ friends: UserPublic[] }` onde `UserPublic = { id, name, email }`
- `GET /social/friend-requests/incoming` — `200` lista pendentes recebidas
- `GET /social/friend-requests/outgoing` — `200` lista pendentes enviadas
- `GET /social/users/search?email=` — `200` `{ id, name, email, relationshipStatus }`
- Auth: reutilizar padrão JWT de `UserMovieEntryAuthHook` (ou hook equivalente renomeado para uso social)
- Descoberta: reutilizar `IUserRepository.findByEmail` do módulo users
