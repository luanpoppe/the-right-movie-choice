# Filmes assistidos, favoritos e watchlist do usuário

> **id**: `user-watched-movies` · **criada**: 2026-09-05 · **idioma**: pt-BR

## Contexto

Usuários autenticados precisam registrar filmes que já assistiram (com nota e data opcionais), marcar favoritos e adicionar títulos a uma watchlist genérica. A persistência usa uma linha por par usuário+filme (`tmdbId` como chave), com colunas booleanas para cada estado. Listas personalizáveis ficam para uma mudança futura com tabelas próprias. Esta mudança é base para filtrar recomendações e enriquecer o perfil do usuário depois.

## Decisões macro

- **Decisão**: Apenas usuário autenticado (JWT). **Por quê**: persistência por usuário no Postgres. **Alternativa descartada**: guest com localStorage.
- **Decisão**: `tmdbId` obrigatório em cada item; `movieId` (FK `Movie`) opcional quando o filme existir no catálogo local. **Por quê**: recomendações podem existir antes do upsert no Postgres. **Alternativa descartada**: FK obrigatória só para `Movie.id`.
- **Decisão**: Tabela única `UserMovieEntry` — uma linha por `(userId, tmdbId)` com colunas `watched`, `favorite`, `inWatchlist` (booleans) e `rating` (1–10) / `watchedAt` opcionais quando assistido. **Por quê**: simples para os três estados fixos da UI; consultas sem join. **Alternativa descartada**: `UserMovieList` + `UserMovieListItem` (over-engineering para flags fixos).
- **Decisão**: Listas personalizáveis pelo usuário ficam fora desta mudança; quando chegarem, novas tabelas em mudança separada. **Por quê**: o usuário aceita refatoração/aditivo futuro em troca de modelo mais direto agora.
- **Decisão**: Expor `tmdbId` e `imdbId` na resposta pública de `/movie/recommendation`. **Por quê**: o SPA precisa do identificador estável para chamar a API de listas. **Alternativa descartada**: lookup por título/ano ao marcar.
- **Decisão**: Reutilizar `domains/movies`, padrões de auth JWT existentes, Prisma em subpasta de repositório e testes em `specs/`. **Por quê**: consistência com o projeto. **Alternativa descartada**: módulo paralelo ou Prisma direto no controller.

## Features (executadas sequencialmente)

1. **user-movie-lists-persistence** — Tabela `UserMovieEntry`, migração e repositório (flags + metadados de assistido).
2. **user-movie-lists-api** — Endpoints autenticados para assistido (com nota/data), favorito e watchlist, incluindo listagens.
3. **recommendation-expose-ids** — Inclui `tmdbId` e `imdbId` na resposta pública de recommendation (backend + DTO do SPA).
4. **user-movie-card-actions** — Ações nos cards do chat: assistido, favorito e watchlist com feedback visual.
5. **user-movie-library-ui** — Rota `/my-movies` com abas Assistidos, Quero ver e Favoritos.

## Escopo

**Dentro**: persistência Postgres; API completa watched/favorite/watchlist; expor ids na recommendation; ações nos cards; biblioteca `/my-movies`; auth obrigatório; marcar e desmarcar (toggle).

**Fora**: filtro na recommendation por não assistidos; listas personalizáveis (novas tabelas em mudança futura); importação em massa; suporte a guest/anônimo; páginas de lista separadas (`/watched`, `/watchlist` isoladas).
