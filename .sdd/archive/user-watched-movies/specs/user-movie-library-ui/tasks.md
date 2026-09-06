# Tasks: user-movie-library-ui

> Parte de [`user-watched-movies`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F5.C<m>` (feature 5 no `plan.md`).

## Chunks

### F5.C1 — Domínio e repositório: enriquecimento + ordenação

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/domain/entities/user-movie-entry.entity.ts`, `packages/backend/src/domains/movies/infrastructure/repositories/user-movie-entry/user-movie-entry-list-order.utils.ts`, `packages/backend/src/domains/movies/infrastructure/repositories/user-movie-entry/prisma-user-movie-entry.repository.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `user-movie-entry.entity.ts` → 2) `user-movie-entry-list-order.utils.ts` → 3) `prisma-user-movie-entry.repository.ts`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Adiciona `UserMovieEntryMovieSummary` ao domínio; `listByUser` faz join opcional em `Movie` por `tmdbId` + `pt-BR`; ordena por `watchedAt desc` (nulos por último) quando `watched=true`, senão `updatedAt desc`.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test prisma-user-movie-entry.repository.spec.ts`

### F5.C2 — Mappers e DTO HTTP da resposta enriquecida

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/mappers/user-movie-entry-prisma.mapper.ts`, `packages/backend/src/domains/movies/infrastructure/http/mappers/user-movie-entry-response.mapper.ts`, `packages/backend/src/domains/movies/infrastructure/http/dto/user-movie-entry.dto.ts`
- **Depende de**: F5.C1
- **Ordem de revisão**: 1) `user-movie-entry-prisma.mapper.ts` → 2) `user-movie-entry.dto.ts` → 3) `user-movie-entry-response.mapper.ts`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Mapeia `movie: { title, year, posterPath } | null` na resposta pública de list/get/patch; schemas Zod do HTTP incluem o campo opcional `movie`.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test user-movie-entry.controller.spec.ts`

### F5.C3 — Service e tipos do SPA para listagem filtrada

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/features/movies/entities/user-movie-entry.entity.ts`, `packages/frontend/src/features/movies/dto/user-movie-entry.dto.ts`, `packages/frontend/src/features/movies/services/user-movie-entry.service.ts`
- **Depende de**: F5.C2
- **Ordem de revisão**: 1) `user-movie-entry.entity.ts` → 2) `user-movie-entry.dto.ts` → 3) `user-movie-entry.service.ts`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Espelha campo `movie` no entity/DTO do SPA; `listEntries(filter)` aceita `{ watched?, favorite?, inWatchlist? }` e monta query string no GET.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/frontend lint`

### F5.C4 — Card da biblioteca e utilitários de exibição

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/features/movies/utils/tmdb-poster.utils.ts`, `packages/frontend/src/components/library-movie-card.tsx`
- **Depende de**: F5.C3
- **Ordem de revisão**: 1) `tmdb-poster.utils.ts` → 2) `library-movie-card.tsx`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Card em grid com poster (URL TMDB ou placeholder), título/ano, nota e data na aba assistidos; placeholder `Filme #tmdbId` quando `movie` é null; reutiliza `MovieCardListActions` para toggles.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/frontend lint`

### F5.C5 — Página /my-movies com abas e rota protegida

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/pages/MyMoviesPage.tsx`, `packages/frontend/src/routes/index.tsx`, `packages/frontend/src/features/auth/pages/LoginPage.tsx`
- **Depende de**: F5.C4
- **Ordem de revisão**: 1) `MyMoviesPage.tsx` → 2) `routes/index.tsx` → 3) `LoginPage.tsx`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Página com abas Radix (Assistidos/Quero ver/Favoritos), fetch por aba, empty state com CTA ao chat, toast+retry em falha; guest redireciona a `/login` com retorno; envolve em `UserMovieEntriesProvider`; toggle remove card da aba após PATCH.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/frontend lint`

### F5.C6 — Link "Meus filmes" no header

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/layouts/Header.tsx`
- **Depende de**: F5.C5
- **Ordem de revisão**: 1) `Header.tsx`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Exibe link "Meus filmes" para `/my-movies` quando autenticado, ao lado das ações de auth.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/frontend lint`
