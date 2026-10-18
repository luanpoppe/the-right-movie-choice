# Editar e deletar a marcação de assistido na modal

> **id**: `watched-entry-modal` · **criada**: 2026-10-13 · **idioma**: pt-BR

## Contexto

Hoje, marcar "Watched" num card abre a modal só na primeira vez. Se o filme já está marcado como assistido, clicar no botão desmarca direto, sem passar pela modal — o usuário não consegue rever nem editar a nota e a data que já salvou, e não existe um caminho explícito para remover a marcação. Esta mudança faz o clique em "Watched" já marcado abrir a modal pré-carregada, com ações de atualizar e deletar.

## Decisões macro

- **Decisão**: mudança frontend-only, reusando o `PATCH /movie/user-entries/:tmdbId` parcial existente. **Por quê**: o contrato já aceita `watched`, `rating` e `watchedAt` (inclusive `null`), e o `UserMovieEntriesProvider` já faz patch otimista com rollback. **Alternativa descartada**: criar `DELETE` dedicado no backend — superfície e contrato novos sem ganho.
- **Decisão**: "deletar" = desmarcar `watched` e limpar `rating` e `watchedAt` no mesmo PATCH, mantendo `favorite` e `inWatchlist`. **Por quê**: evita dado órfão (nota/data sem marcação de assistido). **Alternativa descartada**: só `watched:false` preservando nota/data (dado oculto no backend).
- **Decisão**: o novo comportamento vale em todos os cards que usam `MovieCardListActions` (chat, busca, welcome, biblioteca). **Por quê**: é componente compartilhado; comportamento coerente em todas as telas. **Alternativa descartada**: restringir ao chat com prop de diferenciação.

## Features (executadas sequencialmente)

1. **watched-modal-edit** — Clicar em "Watched" já marcado abre a modal pré-carregada com nota e data; atualizar salva as mudanças e deletar desmarca o assistido limpando nota e data.

## Escopo

**Dentro**: pré-carregar nota e data na modal a partir da entrada já salva; ação de atualizar; ação de deletar (watched + nota + data); estados de patching/loading na modal; testes unitários dos componentes tocados.

**Fora**: mudanças de backend/DB; afetar os toggles de favorito/watchlist; validação nova além da faixa 1–10 já existente; toast específico além do genérico já usado pelo provider.
