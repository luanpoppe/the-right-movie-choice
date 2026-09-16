# Modelo de conversa (UserConversation)

> Atualizado em 2026-09-16 · fontes: `schema.prisma`, `IUserConversationRepository`, `PrismaUserConversationRepository`

## O que é

Metadados de conversa de chat por usuário autenticado: vínculo `userId` ↔ `chatId` (UUID do header/thread), título opcional e timestamps. As mensagens ficam no checkpointer (feature futura); esta tabela só lista, renomeia e exclui conversas.

## Como funciona

- **Prisma:** model `UserConversation` com FK `User` (`onDelete: Cascade`), `chatId` @unique global, índice `(userId, updatedAt)` para listagem por recência.
- **Domínio:** `UserConversationEntity`, porta `IUserConversationRepository` (create, findById, findByChatId, listByUserId, updateTitle, deleteById) — todas as operações recebem `userId` para isolamento.
- **Validação:** `UserConversationValidationUtils` — `userId` inteiro positivo, `chatId` UUID v4, título ≤ 200 chars (`UserConversationConstants.MAX_TITLE_LENGTH`).
- **Infra:** `PrismaUserConversationRepository` + `UserConversationPrismaMapper`; listagem `orderBy: updatedAt desc`.

## Decisões e porquês

- **Hard delete** — sem soft delete; exclusão remove a linha. (origem: spec conversation-model, grill macro)
- **`title` nullable** — conversa criada antes da IA nomear no 1º turno. (origem: spec)
- **`chatId` @unique global** — mesmo UUID não pode existir para dois usuários; `findByChatId` ainda filtra por `userId`. (origem: spec REQ-3)
- **Título > 200 chars rejeitado no domínio** — não trunca. (origem: spec edge case)

## Notas

- Guests não usam esta tabela — mantêm Redis TTL.
- `create` mapeia P2002 para `UserConversationChatIdConflictException` (409).
- `updateTitle` usa `updateMany` com `{ id, userId }` para isolamento atômico.
