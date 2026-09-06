# Spec: Ações nos cards do chat

> Parte de [`user-watched-movies`](../../plan.md)

## Resumo

Adiciona toggles de assistido, favorito e watchlist nos cards de filme do chat, com feedback visual do estado atual, chamando a API autenticada de listas via `tmdbId`. Marcar como assistido abre um modal compacto para nota e data (ambos opcionais). Visitante anônimo não persiste — vê CTA para login em vez dos toggles ativos.

## Requirements

### REQ-1: Usuário autenticado alterna favorito no card

- **Dado que** o usuário está logado e o card exibe "Inception" com `tmdbId = 27205`
- **Quando** toca no controle de favorito
- **Então** o SPA envia `PATCH /movie/user-entries/27205` com `{ "favorite": true }`
- **E** o ícone do card passa a indicar favorito ativo

### REQ-2: Usuário autenticado alterna watchlist no card

- **Dado que** o usuário está logado e o card tem `tmdbId = 550`
- **Quando** toca no controle de watchlist estando desmarcado
- **Então** o SPA envia `PATCH /movie/user-entries/550` com `{ "inWatchlist": true }`
- **E** o ícone do card passa a indicar watchlist ativa

### REQ-3: Marcar assistido abre modal de confirmação

- **Dado que** o usuário está logado e o card tem `tmdbId = 157336` com assistido desmarcado
- **Quando** toca no controle de assistido
- **Então** abre um modal compacto com campos de nota (1–10) e data assistida
- **E** o modal exibe botão de confirmar
- **E** nenhum `PATCH` é enviado antes da confirmação

### REQ-4: Confirmar assistido sem nota nem data

- **Dado que** o modal de assistido está aberto para `tmdbId = 157336`
- **Quando** o usuário confirma sem preencher nota nem data
- **Então** o SPA envia `PATCH /movie/user-entries/157336` com `{ "watched": true }`
- **E** o body não inclui `rating` nem `watchedAt`
- **E** o ícone do card passa a indicar assistido ativo

### REQ-5: Confirmar assistido com nota e data opcionais

- **Dado que** o modal de assistido está aberto para `tmdbId = 157336`
- **Quando** o usuário informa nota `8` e data `2026-03-15` e confirma
- **Então** o SPA envia `PATCH` com `{ "watched": true, "rating": 8, "watchedAt": "2026-03-15T00:00:00.000Z" }`
- **E** o ícone do card passa a indicar assistido ativo

### REQ-6: Desmarcar assistido remove o estado no card

- **Dado que** a entrada de `tmdbId = 157336` está com `watched = true`
- **Quando** o usuário toca novamente no controle de assistido
- **Então** o SPA envia `PATCH` com `{ "watched": false }` sem abrir o modal
- **E** o ícone de assistido volta ao estado inativo

### REQ-7: Visitante anônimo não chama a API de listas

- **Dado que** o usuário não está logado
- **Quando** visualiza um card com `tmdbId` presente
- **Então** os toggles não disparam `PATCH /movie/user-entries`
- **E** o card exibe convite para login/registro no lugar de ações persistidas

### REQ-8: Card sem tmdbId não exibe ações de lista

- **Dado que** a recommendation retornou filme sem `tmdbId` (miss no catálogo)
- **Quando** o card é renderizado
- **Então** a barra de toggles de lista não aparece

### REQ-9: Estado inicial reflete entradas existentes

- **Entrada** usuário autenticado abre o chat com cards `tmdbId` 27205 (favorito) e 550 (sem entrada)
- **Saída** card 27205 já mostra favorito ativo antes de qualquer clique
- **E** card 550 mostra os três toggles inativos

### REQ-10: Falha de PATCH reverte feedback otimista

- **Entrada** toggle de favorito com rede retornando erro 500
- **Saída** ícone volta ao estado anterior
- **Erro** toast de erro genérico ao usuário (mesmo padrão do chat)

## Edge cases

- Fechar o modal de assistido sem confirmar  ||  nenhum `PATCH` é enviado e o card permanece desmarcado
- Confirmar assistido só com nota, sem data  ||  `PATCH` envia `{ "watched": true, "rating": N }` sem `watchedAt`
- Dois cliques rápidos no mesmo toggle  ||  apenas o último estado persiste; UI não fica inconsistente após resposta da API
- PATCH retorna `entry: null` ao desmarcar último flag  ||  card trata como todos os toggles inativos
- Token expira durante PATCH  ||  fluxo de refresh silencioso do `movieClient` tenta uma vez; se falhar, sessão expira como hoje no chat

## Contratos expostos

- Referência frontend: `packages/frontend/src/features/movies/services/user-movie-entry.service.ts:UserMovieEntryService` (`listEntries`, `patchEntry`).
- Referência backend: `packages/backend/src/domains/movies/infrastructure/http/dto/user-movie-entry.dto.ts:UserMovieEntryPatchDTOSchema`
