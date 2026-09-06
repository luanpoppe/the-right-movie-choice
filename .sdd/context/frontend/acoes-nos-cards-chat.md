# Ações nos cards do chat (assistido, favorito, watchlist)
> Atualizado em 2026-09-06 · fontes: feature `user-movie-card-actions`, `MovieCard`, `UserMovieEntriesProvider`

## O que é
Toggles de assistido, favorito e watchlist nos cards de filme do chat, persistidos via API autenticada por `tmdbId`.

## Como funciona
- **Service** (`UserMovieEntryService`): `listEntries()` → GET `/movie/user-entries`; `patchEntry(tmdbId, patch)` → PATCH parcial.
- **Contexto** (`UserMovieEntriesProvider`): hidrata ao montar quando há `accessToken`; mapa `tmdbId→entry`; `patchEntry` com UI otimista, sequência por `tmdbId` (cliques rápidos), rollback + toast genérico em falha.
- **UI** (`MovieCard` → `MovieCardListActions`): barra só com `tmdbId`; guest vê CTA login/registro (sem PATCH); autenticado alterna favorito/watchlist direto; marcar assistido abre modal (nota 1–10 e data opcionais); desmarcar assistido é toggle direto.
- **Integração** (`Home`): quando chat iniciado e usuário logado, envolve `<Chat />` no provider. Guest permanece sem provider (path guest não usa o hook).

## Decisões e porquês
- Split guest/autenticado em `MovieCardListActions` — guest não chama `useUserMovieEntries` (evita exigir Provider para visitante).
- Provider só no chat autenticado — hidratação começa ao abrir o chat, não na welcome.
- Modal de assistido separado (`MovieCardWatchedModal`) — PATCH só após confirmar; body mínimo `{ watched: true }` se campos vazios.
- Merge utils em `context/` — lógica otimista perto do provider, não em `utils/` genérico.

## Notas
- Cards sem `tmdbId` (miss no catálogo) não exibem barra de ações.
- Falha na hidratação hoje só loga (sem toast) — ver code review A2.
- Testes unitários em `context/specs/` e `components/specs/` (~96% nos arquivos-alvo).
