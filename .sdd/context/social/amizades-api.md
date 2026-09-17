# Amizades (API backend)

> Atualizado em 2026-09-17 · fontes: `packages/backend/src/modules/social/**`, `packages/backend/prisma/schema.prisma`

## O que é

API REST autenticada para amizades bilaterais entre usuários registrados. Um usuário envia solicitação por e-mail; o destinatário aceita ou recusa. Amizade ativa = registro `FriendRequest` com `status: accepted`. Rotas sob `/social/*`.

## Como funciona

- **Domínio** (`modules/social/domain`): entidades, `RelationshipStatus`, porta `IFriendRequestRepository`, exceções por caso (404/409/400) e `FriendRequestValidationUtils` (validação de e-mail e userId).
- **Persistência**: tabela `FriendRequest` (requesterId, addresseeId, status enum, timestamps). Amizades listadas consultando linhas `accepted` onde o viewer é requester ou addressee. `resolveRelationshipStatus` usa a linha mais recente entre o par.
- **Use cases**: mutação (`SendFriendRequest` com auto-aceite cruzado e reenvio pós-rejected; accept/reject/cancel/remove) e consulta (list friends/incoming/outgoing, search by email).
- **HTTP**: `MakeFriendshipHttpFactory` monta repositório + use cases + `UserMovieEntryAuthHook` (JWT reutilizado, sem hook social duplicado). `FriendshipController` + rotas registradas em `app.ts`.

## Decisões e porquês

- **Checagem de duplicata na aplicação, não partial unique index no Postgres** — evita migration raw SQL e confia nos use cases; trade-off: concorrência exige cuidado extra (origem: grill F1.C3, 2026-09-17).
- **Reutilizar `UserMovieEntryAuthHook`** — mesmo parse JWT e contexto `userMovieEntryAuth`; elimina duplicação de hook social (origem: revisão F1.C7, 2026-09-17).
- **Histórico de solicitações preservado** — rejeição não apaga linha; novo envio após rejected cria nova linha `pending` (origem: spec REQ-11).
- **Auto-aceite cruzado** — se B já pediu amizade a A e A envia para B, a pendência existente vira `accepted` (origem: spec REQ-10).
- **Isolamento por usuário via 404** — aceitar/recusar/cancelar com JWT alheio retorna not found, sem vazar existência (origem: spec REQ-13).

## Notas

- Descoberta de usuário: `IUserRepository.findByEmail` (e-mail normalizado para lowercase no módulo social).
- Próximas features desta mudança: grupos (`user-groups`) e UI (`social-ui`); amizade não é pré-requisito para grupo.
- Contratos: ver `specs/friendship/spec.md` seção "Contratos expostos".
