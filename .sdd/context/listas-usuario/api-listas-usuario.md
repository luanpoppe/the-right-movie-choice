# API de listas do usuário (user-movie-entries)

> Atualizado em 2026-09-06 · fontes: `MakeUserMovieEntryHttpFactory`, `UserMovieEntryController`, `UserMovieEntryAuthHook`, `routes.ts`

## O que é

Endpoints HTTP autenticados (JWT) para consultar e atualizar o status de um filme por `tmdbId` — assistido (nota/data opcionais), favorito e watchlist — e listar entradas do usuário. Delega persistência a `IUserMovieEntryRepository`; não enriquece com TMDB nesta feature.

## Como funciona

- **Rotas** (`routes.ts`): `GET /movie/user-entries`, `GET /movie/user-entries/:tmdbId`, `PATCH /movie/user-entries/:tmdbId` — todas com `preHandler` JWT.
- **Auth**: `UserMovieEntryAuthHook` valida `Authorization: Bearer`, popula `request.userMovieEntryAuth.userId` — controllers nunca leem `userId` do cliente.
- **Factory**: `MakeUserMovieEntryHttpFactory` monta `JoseAccessTokenProvider` → hook, `PrismaUserMovieEntryRepository` → três use cases → `UserMovieEntryController`.
- **Validação HTTP**: schemas Zod em `user-movie-entry.dto.ts`; controller revalida com `parseOrThrow` (query aceita boolean pós-Fastify ou string crua).
- **Respostas**: mapper público sem `userId`; GET ausente → `404`; PATCH que zera flags → `200 { entry: null }`.

## Decisões e porquês

- `userId` só do JWT — isolamento multi-tenant por escopo no repositório, não parâmetro público. (origem: spec REQ-7/8, F2.C3–C5)
- Revalidação Zod no controller apesar do `validatorCompiler` — testes unitários e defesa em profundidade; query boolean union evita 400 após coerção Fastify. (origem: code review F2.C4, fix A1)
- CORS global inclui `PATCH` — primeira rota PATCH do backend; sem isso o SPA cross-origin não consegue marcar assistido/favorito. (origem: code review F2.C5, fix A1)
- 404 no GET sem exception de domínio — resposta literal `{ error: "User movie entry not found" }`. (origem: F2.C4)

## Notas

- Testes unitários cobrem controller, hook, factory wiring e registro de rotas (mock Fastify). E2E com JWT real e concorrência de PATCH ficam fora do escopo unitário.
- `tmdbId` na recommendation vem de [IDs na recommendation](../recomendacoes-filmes/ids-na-recommendation.md) — pré-requisito para toggles nos cards.
