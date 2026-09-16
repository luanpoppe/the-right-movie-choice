# Spec: Modelo de conversa

> Parte de [`user-chat-history`](../../plan.md)

## Resumo

Cria a tabela `UserConversation` no Postgres (metadados por usuário + `chatId`), a entidade de domínio, a porta `IUserConversationRepository` e o adapter Prisma. Esta feature não expõe HTTP nem toca o checkpointer — só o contrato interno que a API e o fluxo de recommendation vão consumir nas features seguintes.

## Requirements

### REQ-1: Persistir nova conversa de um usuário

- **Dado que** o usuário autenticado tem `id = 7` e ainda não existe conversa com `chatId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
- **Quando** o repositório cria `{ userId: 7, chatId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }` sem título
- **Então** existe uma linha com `userId = 7`, `chatId` igual ao UUID informado e `title = null`
- **E** `createdAt` e `updatedAt` são preenchidos na criação

### REQ-2: Listar conversas do usuário por recência

- **Dado que** o usuário `id = 7` tem três conversas com `updatedAt` distintos (A mais recente, C mais antiga)
- **Quando** o repositório lista todas de `userId = 7` ordenadas por `updatedAt` descendente
- **Então** retorna A, depois B, depois C
- **E** não inclui conversas de outros usuários

### REQ-3: Unicidade global do chatId

- **Entrada** criação de conversa com `chatId = "f47ac10b-58cc-4372-a567-0e02b2c3d479"` quando já existe linha com o mesmo `chatId` (mesmo ou outro `userId`)
- **Saída** a segunda operação falha por violação de unique  ||  não cria linha duplicada
- **Erro** `chatId` vazio ou string inválida para UUID → rejeição no domínio antes do Prisma

### REQ-4: Atualizar título de uma conversa

- **Dado que** existe conversa `id = 12` do usuário `id = 7` com `title = null`
- **Quando** o repositório atualiza o título para `"Filmes de ficção dos anos 90"`
- **Então** a linha `id = 12` passa a ter esse título
- **E** `updatedAt` é atualizado

### REQ-5: Excluir conversa (hard delete)

- **Dado que** existe conversa `id = 12` do usuário `id = 7`
- **Quando** o repositório exclui por `(id = 12, userId = 7)`
- **Então** a linha some do banco
- **E** leitura por `id` retorna ausência (`null`)

### REQ-6: Isolamento por usuário nas operações

- **Entrada** conversa `id = 12` pertence ao usuário `id = 7`
- **Saída** leitura/atualização/exclusão com `userId = 99` retorna ausência ou falha controlada  ||  não altera a linha do usuário 7
- **Erro** `userId` inválido (≤ 0) → rejeição no domínio antes do Prisma

### REQ-7: Migração idempotente

- **Dado que** o desenvolvedor roda `pnpm db:migrate` no backend
- **Quando** a migração desta feature é aplicada
- **Então** a tabela `UserConversation` existe com colunas, FK para `User` (`onDelete: Cascade`), `@unique` em `chatId` e índice em `(userId, updatedAt)`
- **E** reaplicar a mesma migração em banco já migrado não falha

## Edge cases

- Usuário apagado (`User` removido) → conversas do usuário removidas em cascata (`onDelete: Cascade`)
- Duas criações concorrentes com o mesmo `chatId` → unique em `chatId` garante uma linha  ||  a segunda falha
- Título muito longo na atualização → truncar ou rejeitar no domínio com limite nomeado (decisão do data-modeler no chunk de migração)
