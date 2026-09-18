# Chat de recomendações em grupo

> **id**: `group-recommendation-chat` · **criada**: 2026-09-18 · **idioma**: pt-BR

## Contexto

Grupos já existem (dono, membros, convites), mas não há conversa nem recomendação coletiva. Esta mudança adiciona **vários chats por grupo**, onde membros pedem recomendações de filmes filtrando o que **já foi assistido** por um subconjunto de membros (com atalho para selecionar todos). Reutiliza o pipeline de IA/`excludeWatched` e o checkpointer Postgres já usados no chat autenticado individual.

## Decisões macro

- **Múltiplos chats por grupo**: cada chat tem thread/histórico próprio; qualquer membro pode criar um novo chat.
- **Navegação**: lista de chats do grupo → abrir um (padrão estilo `/conversations`); aba **Chat** em `/social/groups/:id`.
- **Filtro de assistidos**: cada chat guarda **quais membros entram no filtro** (padrão reutilizável por chat); UI oferece seleção explícita com atalho “selecionar todos”.
- **Sincronização**: polling ao abrir/enviar (sem WebSocket no MVP).
- **Reúso**: módulo `social`, auth JWT existente, checkpointer Postgres, pipeline `excludeWatched` e lookup de catálogo — estender, não reescrever.
- **Acesso**: só membros autenticados do grupo; sem convidado/cota anônima no chat de grupo.
- **Alternativa descartada**: um único thread por grupo — o usuário pediu suporte a vários chats.

## Features (executadas sequencialmente)

1. **group-members-api** — API para listar membros do grupo (id, nome, e-mail) usada pelo seletor.
2. **group-recommendation-chat-api** — CRUD de chats do grupo, histórico compartilhado, PATCH de membros do filtro e POST de recomendação com exclude multi-usuário.
3. **group-recommendation-chat-ui** — Aba Chat no detalhe do grupo: CRUD de chats, conversa e seletor de membros.

## Escopo

**Dentro**: múltiplos chats por grupo; **CRUD completo de chats** (criar, listar, abrir, renomear, excluir); mensagens/recomendações compartilhadas no thread do chat; filtro de assistidos por membros selecionados (com “todos”); polling.

**Fora**: WebSocket/SSE; notificações push; editar/apagar **mensagens**; acesso de visitante não-membro.
