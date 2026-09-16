# API de conversas (CRUD + integração recommendation)

> Atualizado em 2026-09-16 · fontes: `user-conversation.controller.ts`, use cases F3, `movie-recommendation.controller.ts`, `conversation-title.generator.ts`

## O que é

Expõe CRUD REST autenticado de `UserConversation` em `/movie/conversations*`: criar (servidor gera `chatId`), listar por recência, retomar com histórico do checkpointer Postgres, renomear e excluir (metadados + thread). Integra com `POST /movie/recommendation` para validar conversa, atualizar `updatedAt` a cada turno e gerar título IA no primeiro turno.

## Como funciona

- **HTTP:** `UserConversationController` + `MakeUserConversationHttpFactory` registram 5 rotas em `routes.ts` com `UserMovieEntryAuthHook` (mesmo JWT das listas de filme).
- **Aplicação:** use cases finos (`Create`, `List`, `Get`, `UpdateTitle`, `Delete`) delegam a `IUserConversationRepository` e, no `Get`, a `IChatHistoryRepository`.
- **DELETE:** `DeleteUserConversationUseCase` purga thread via `IChatThreadRepository` (`PostgresChatThreadRepository`) antes de remover metadados — falha no purge aborta sem tocar a linha.
- **Recommendation autenticado:** `MovieRecommendationController` valida `findByChatId` (404 se ausente), executa recommendation e, se `title === null`, roda `ConversationTitleGenerator` em `Promise.all`. Após sucesso, `updateTitle` (se gerou) e `touchUpdatedAt`.
- **Guest:** fluxo de recommendation inalterado (sem validação de conversa).

## Decisões e porquês

- **`touchUpdatedAt` via `updateMany` com filtro `userId+chatId`** — Prisma `update` só aceita campo único no `where`; filtro composto na escrita garante isolamento REQ-9 sem tocar linha de outro usuário. (origem: F3.C1)
- **`UserConversationByChatIdNotFoundException` separada** — REQ-6 usa `chatId` do header; `UserConversationNotFoundException` usa `id` numérico dos endpoints CRUD. (origem: F3.C8)
- **Handler de recommendation refatorado em métodos privados** — legibilidade; padrão alinhado ao `UserConversationController`. (origem: revisão F3.C8)
- **Duas instâncias AI na factory** — gerador de título não compartilha memory/checkpointer do use case de recommendation. (origem: F3.C8)
- **Título IA falhou → `null`, recommendation segue** — REQ-7; rename manual depois. (origem: spec)

## Notas

- Listagem sem paginação (MVP).
- `GET /movie/conversations/:id` propaga erro se checkpointer Postgres indisponível (sem fallback silencioso).
- Code review (fechamento): A1 → `UserConversationDeleteAfterPurgeFailedException` (500) se metadados falham após purge; A2/A3 → `touchUpdatedAt` antes da recommendation, título depois.
