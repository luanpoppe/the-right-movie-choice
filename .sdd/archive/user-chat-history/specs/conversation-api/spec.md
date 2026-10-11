# Spec: API de conversas

> Parte de [`user-chat-history`](../../plan.md)

## Resumo

Expõe CRUD REST autenticado de conversas (`UserConversation`): o servidor gera `chatId`, lista/retoma/renomeia/exclui metadados e, ao retomar, devolve também o histórico do checkpointer Postgres. Integra com `POST /movie/recommendation`: no 1º turno gera título IA em paralelo (`Promise.all`) quando `title` é null; em todo turno autenticado atualiza `updatedAt`. Exclusão remove metadados e apaga o thread no checkpointer.

## Requirements

### REQ-1: Criar nova conversa

- **Dado que** o cliente envia `POST /movie/conversations` com `Authorization: Bearer <JWT válido>` do usuário `id = 7`
- **Quando** a API processa a criação
- **Então** retorna `201` com `id`, `chatId` (UUID v4 gerado pelo servidor) e `title = null`
- **E** persiste linha `UserConversation` com `userId = 7` e timestamps preenchidos

### REQ-2: Listar conversas do usuário

- **Dado que** o usuário `id = 7` tem conversas com `updatedAt` distintos
- **Quando** o cliente envia `GET /movie/conversations` com JWT válido
- **Então** retorna `200` com array ordenado por `updatedAt` descendente
- **E** cada item inclui `id`, `chatId`, `title`, `createdAt`, `updatedAt`
- **E** não inclui conversas de outros usuários

### REQ-3: Retomar conversa com histórico

- **Dado que** existe conversa `id = 12` do usuário `id = 7` com `chatId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"` e mensagens no checkpointer Postgres
- **Quando** o cliente envia `GET /movie/conversations/12` com JWT válido
- **Então** retorna `200` com metadados da conversa
- **E** inclui `messages` mapeadas via `IChatHistoryRepository.getHistory(chatId)` no formato `ChatHistoryEntity` (`["user"|"ai", conteúdo]`)

### REQ-4: Renomear conversa

- **Dado que** existe conversa `id = 12` do usuário `id = 7`
- **Quando** o cliente envia `PATCH /movie/conversations/12` com body `{ "title": "Filmes de ficção dos anos 90" }` e JWT válido
- **Então** retorna `200` com conversa atualizada
- **E** `updatedAt` é atualizado

### REQ-5: Excluir conversa e histórico

- **Dado que** existe conversa `id = 12` do usuário `id = 7` com `chatId` conhecido
- **Quando** o cliente envia `DELETE /movie/conversations/12` com JWT válido
- **Então** retorna `204`
- **E** remove a linha `UserConversation`
- **E** apaga o thread correspondente no checkpointer Postgres daquele `chatId`

### REQ-6: Atualizar recência a cada mensagem

- **Entrada** `POST /movie/recommendation` autenticado com header `chatId` de conversa existente do usuário
- **Saída** após processar o turno, `updatedAt` da conversa com aquele `chatId` reflete o momento do request
- **Erro** `chatId` sem linha `UserConversation` do usuário → `404`  ||  recommendation não executa

### REQ-7: Título IA no primeiro turno

- **Entrada** `POST /movie/recommendation` autenticado com `chatId` cuja conversa tem `title = null` e primeira mensagem do usuário no body
- **Saída** recommendation e geração de título rodam em paralelo (`Promise.all`)
- **E** título retornado pela IA (string ≤ 200 chars) é salvo na conversa se a chamada de título concluir com sucesso
- **Erro** falha só na IA de título → recommendation segue normalmente  ||  `title` permanece `null` até rename manual

### REQ-8: Acesso somente autenticado

- **Entrada** qualquer rota `/movie/conversations*` sem JWT válido
- **Saída** `401`  ||  nenhuma leitura/escrita de conversa

### REQ-9: Isolamento por usuário nos endpoints

- **Entrada** conversa `id = 12` pertence ao usuário `id = 7`
- **Saída** GET/PATCH/DELETE com JWT do usuário `id = 99` → `404`  ||  não expõe nem altera dados do usuário 7

## Edge cases

- Título IA retorna string vazia ou > 200 chars → rejeição no domínio  ||  `title` permanece `null`
- Checkpointer Postgres indisponível em GET retomar → erro propagado (`5xx`)  ||  sem fallback silencioso
- DELETE com falha ao purgar checkpointer → operação falha  ||  metadados não ficam removidos sem confirmação (transação lógica ou ordem reversível documentada na implementação)
- Listagem sem paginação: retorna todas as conversas do usuário (MVP)

## Contratos expostos

- `POST /movie/conversations` — `201` corpo `{ id, chatId, title, createdAt, updatedAt }`  ||  auth JWT obrigatória (padrão `UserMovieEntryAuthHook`)
- `GET /movie/conversations` — `200` array de conversas resumidas
- `GET /movie/conversations/:id` — `200` metadados + `messages: ChatHistoryEntity`  ||  referência `packages/backend/src/core/entities/chat-history.entity.ts:ChatHistoryEntity`
- `PATCH /movie/conversations/:id` — body `{ title: string }`  ||  `200` conversa atualizada
- `DELETE /movie/conversations/:id` — `204`
- Integração: `packages/backend/src/domains/movies/infrastructure/http/controllers/movie-recommendation.controller.ts:MovieRecommendationController` — passa a validar conversa existente, atualizar `updatedAt` e disparar título no 1º turno
