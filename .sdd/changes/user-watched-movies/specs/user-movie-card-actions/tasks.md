# Tasks: user-movie-card-actions

> Parte de [`user-watched-movies`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F4.C<m>` (feature 4 no `plan.md`).

## Chunks

### F4.C1 — DTO, entidade e service de user-movie-entry no SPA

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/features/movies/dto/user-movie-entry.dto.ts`, `packages/frontend/src/features/movies/entities/user-movie-entry.entity.ts`, `packages/frontend/src/features/movies/services/user-movie-entry.service.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `user-movie-entry.dto.ts` → 2) `user-movie-entry.entity.ts` → 3) `user-movie-entry.service.ts`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Espelha schemas Zod do backend para entrada/resposta de user-entries; expõe `UserMovieEntryService.listEntries()` e `patchEntry(tmdbId, patch)` via `movieClient` com parse Zod na resposta.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/frontend lint` nos arquivos criados

### F4.C2 — Contexto de entradas do usuário (hidratação + PATCH otimista)

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/features/movies/context/user-movie-entries.context.tsx`
- **Depende de**: F4.C1
- **Ordem de revisão**: 1) `user-movie-entries.context.tsx`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Provider carrega `GET /movie/user-entries` ao montar quando autenticado; mantém mapa `tmdbId→entry` e expõe patch com UI otimista, rollback e toast em erro.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/frontend lint`

### F4.C3 — Ações no card e modal de assistido

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/components/ui/dialog.tsx`, `packages/frontend/src/components/movie-card-watched-modal.tsx`, `packages/frontend/src/components/movie-card-list-actions.tsx`, `packages/frontend/src/components/movie-card.tsx`
- **Depende de**: F4.C2
- **Ordem de revisão**: 1) `dialog.tsx` → 2) `movie-card-watched-modal.tsx` → 3) `movie-card-list-actions.tsx` → 4) `movie-card.tsx`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Barra de toggles favorito/watchlist/assistido no `MovieCard`; marcar assistido abre modal compacto (nota 1–10 e data opcionais); desmarcar é toggle direto; guest vê CTA login; sem `tmdbId` esconde a barra.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/frontend lint`

### F4.C4 — Integração no Chat e Home

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/features/chat/Chat.tsx`, `packages/frontend/src/pages/Home.tsx`
- **Depende de**: F4.C3
- **Ordem de revisão**: 1) `Home.tsx` → 2) `Chat.tsx`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Envolve o chat com `UserMovieEntriesProvider` quando autenticado; propaga estado de auth e entradas aos `MovieCard`.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/frontend lint`
