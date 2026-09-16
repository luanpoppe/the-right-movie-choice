# Histórico de conversas por usuário

> **id**: `user-chat-history` · **criada**: 2026-09-14 · **idioma**: pt-BR

## Contexto

Hoje o chat de recomendações persiste turnos só no checkpointer Redis da `@luanpoppe/ai` (TTL 20 min, `threadId` = header `chatId`), sem vínculo com usuário logado e sem forma de listar ou retomar conversas antigas. Esta mudança introduz histórico durável para autenticados: metadados em Postgres (Prisma), mensagens no checkpointer Postgres da lib, API CRUD e sidebar no SPA para navegar entre conversas.

## Decisões macro

- **Decisão**: Histórico persistido só para usuários autenticados; guests mantêm sessão efêmera no Redis com TTL atual. **Por quê**: escopo MVP alinhado ao pedido; guests já têm cota/lock sem conta. **Alternativa descartada**: persistir guests com limite.
- **Decisão**: Memória híbrida — Postgres checkpointer (`@luanpoppe/ai`) para logados, Redis para anônimos; mesma regra de `invoke` + `threadId` sem dual-write. **Por quê**: reúso da lib e da factory existente; evita duplicar estado. **Alternativa descartada**: Postgres para todos ou schema Prisma só para mensagens.
- **Decisão**: Tabela Prisma de conversa (`userId`, `chatId`, título, timestamps) para listagem/CRUD; checkpointer guarda o conteúdo das mensagens. **Por quê**: `thread_id` do LangGraph não carrega `userId`. **Alternativa descartada**: listar só via API interna do checkpointer.
- **Decisão**: Título gerado por IA barata/rápida (OpenRouter) no primeiro turno, em paralelo à recommendation (`Promise.all`); rename manual via API. **Por quê**: títulos legíveis sem bloquear a resposta principal. **Alternativa descartada**: truncar primeira mensagem ou título genérico numerado.
- **Decisão**: Sem limite de quantidade nem TTL para conversas de logados. **Por quê**: MVP simples. **Alternativa descartada**: cap de 50 ou expiração em dias.
- **Decisão**: Reutilizar factory/provider de recommendation, porta `IChatHistoryRepository`, header `chatId` e auth JWT — sem wrapper em `@luanpoppe/ai`. **Por quê**: memória e convenções do projeto. **Alternativa descartada**: módulo isolado recriando o pipeline de IA.

## Features (executadas sequencialmente)

1. **conversation-model** — Modelo Prisma `UserConversation` (userId, chatId, title, timestamps) e migração idempotente.
2. **auth-postgres-checkpointer** — Memory híbrida na factory de recommendation: Postgres para JWT, Redis TTL para guest.
3. **conversation-api** — API CRUD (listar, retomar, nova, excluir, renomear), geração de título IA no primeiro turno e leitura de histórico ao retomar.
4. **conversation-sidebar-ui** — Sidebar na Home: listar, retomar, nova conversa, excluir e renomear (após API estável em local).

## Escopo

**Dentro**: modelo + migração; checkpointer Postgres para logados; endpoints REST autenticados; título IA concorrente no primeiro POST; sidebar no SPA; reúso de `chatId`/`threadId`; CRUD completo; sem TTL/cap para logados.

**Fora**: persistência de histórico para guests; migração de chats Redis antigos; busca full-text nas conversas; compartilhamento entre usuários; export; paginação avançada além do necessário para listagem; mudança no contrato público de `POST /movie/recommendation` além do que o fluxo autenticado exigir.
