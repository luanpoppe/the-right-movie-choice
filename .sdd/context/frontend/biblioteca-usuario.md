# Biblioteca do usuário (/my-movies)
> Atualizado em 2026-09-06 · fontes: `MyMoviesPage.tsx`, `library-movie-card.tsx`, `user-movie-entry.service.ts`, backend `prisma-user-movie-entry.repository.ts`

## O que é
Página autenticada com abas Assistidos, Quero ver e Favoritos. Lista entradas `UserMovieEntry` enriquecidas com metadados do catálogo local (`Movie` pt-BR). Visitante é redirecionado ao login com retorno para `/my-movies`.

## Como funciona
- Rota `my-movies` em `routes/index.tsx`; guest → `Navigate` para `/login?redirect=/my-movies`.
- `LoginRedirectUtils` valida `?redirect=` (path relativo, rejeita `//`); login por senha e Google usam o mesmo `redirectPath`.
- `MyMoviesPage` envolve conteúdo em `UserMovieEntriesProvider`; cada aba chama `UserMovieEntryService.listEntries({ watched | inWatchlist | favorite })`.
- Grid usa `LibraryMovieCard` com `showWatchedDetails` só na aba Assistidos; toggles via `MovieCardListActions`.
- `visibleEntries` filtra `tabEntries` por `getFlags()` do provider — card some da aba após toggle sem reload (REQ-6).
- Empty state com CTA "Pedir recomendações no chat" → `/`; falha GET → toast genérico + "Tentar novamente".
- Header: link "Meus filmes" → `/my-movies` quando `accessToken` presente.

## Decisões e porquês
- **Poster na API:** banco guarda path TMDB relativo; HTTP devolve URL completa via `TmdbPosterUtils` no backend — SPA valida `z.string().url()`.
- **Ordenação:** `watched=true` → `watchedAt desc` (nulos por último); demais filtros → `updatedAt desc`.
- **Catálogo ausente:** card mostra `Filme #tmdbId` + placeholder visual (REQ-10).
- **Flags do provider:** visibilidade dos cards depende do contexto hidratado + fetch filtrado da aba — ver code review A2/A3 se provider falhar ou atrasar.

## Notas
- Link no header documentado também em [header-e-tema.md](header-e-tema.md).
- Testes em `pages/specs/my-movies-page*.spec.*`, `library-movie-card.spec.tsx`, `Header.spec.tsx` e specs de service/utils.
