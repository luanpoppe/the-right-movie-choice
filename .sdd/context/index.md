# Contexto do projeto — The Right Movie Choice
> Como as funcionalidades do projeto funcionam (macro + decisões). Mantido pelos fluxos lp:* e por lp:context. LIDO no início de todo fluxo.

## Áreas / funcionalidades
- [Recomendações de filmes](recomendacoes-filmes/index.md) — chat e exemplos de query via `@luanpoppe/ai`; memória Redis no checkpointer; cota anônima no POST; agente chama `lookupMovies` no TMDB; pipeline exclude-watched para autenticados; toggle no frontend ([exclude-watched-toggle](../frontend/exclude-watched-toggle.md)).
- [Pool de sugestões de busca](recomendacoes-filmes/pool-sugestoes-busca.md) — tabela Postgres (100 itens), seed idempotente via IA, `GET /movie/queries` lê 3 aleatórias com fallback IA, CLI `seed:query-suggestions` no `db:migrate`.
- [IDs na recommendation](recomendacoes-filmes/ids-na-recommendation.md) — `tmdbId`/`imdbId` opcionais na resposta pública de `POST /movie/recommendation` (backend + SPA).
- [Autenticação e usuários](auth/index.md) — JWT, refresh httpOnly, Google OAuth e cadastro unificado por e-mail.
- [Frontend](frontend/index.md) — chat de recomendações, lock anônimo, login/register, refresh silencioso no SPA, shell (header + tema) e biblioteca `/my-movies`.
- [Infraestrutura](infra/index.md) — Docker (Redis/Postgres), Prisma, env, portas e deploy Vercel/Oracle.
- [Catálogo TMDB](catalogo-tmdb.md) — client HTTP v3, DTOs Zod+mapper, cache Redis de details, GETs `/debug/tmdb` em loopback (fora de prod) e teste live opt-in.
- [Catálogo local no Postgres](catalogo-local-postgres.md) — modelo `Movie` + filhas, upsert, finds, lookup em lote (`lookupMovies`: Postgres+Redis batch, TMDB só nos misses) e caminho unitário Redis → banco → TMDB.
- [Listas do usuário](listas-usuario/persistencia-status-filme.md) — `UserMovieEntry`: flags watched/favorite/watchlist e repositório Prisma.
- [API de listas do usuário](listas-usuario/api-listas-usuario.md) — endpoints JWT `/movie/user-entries` (GET list/get, PATCH parcial).
- [Ações nos cards do chat](frontend/acoes-nos-cards-chat.md) — toggles assistido/favorito/watchlist nos `MovieCard` do chat via contexto otimista.
- [Histórico de conversas](historico-conversas/modelo-conversa.md) — metadados `UserConversation` (userId, chatId, title) no Postgres; porta de domínio e adapter Prisma; mensagens ficam no checkpointer (features seguintes).
- [Checkpointer Postgres logados](historico-conversas/checkpointer-postgres-logados.md) — memória híbrida na factory de recommendation: Postgres sem TTL para JWT, Redis TTL 1200s para guest; sem dual-write nem migração de histórico Redis.
- [API de conversas](historico-conversas/api-conversas.md) — CRUD `/movie/conversations*`, integração recommendation (touchUpdatedAt, título IA paralelo), purge de thread no DELETE.
- [Sidebar de conversas (UI)](historico-conversas/sidebar-conversas-ui.md) — listagem `/conversations`, chat com sidebar `/conversations/:id`, Home cria conversa na 1ª mensagem; guest inalterado.
- [Amizades (API backend)](social/amizades-api.md) — solicitação/aceite bilateral, rotas `/social/*`, JWT reutilizado, modelo `FriendRequest` no Postgres.
- [Grupos de usuários (API backend)](social/grupos-api.md) — grupos com dono/membros, convites por e-mail, rotas `/social/groups/*` e `/social/group-invites/*`.
