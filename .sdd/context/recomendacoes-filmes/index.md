# Recomendações de filmes
> Bounded context legado em `packages/backend/src/domains/movies`. POST de recommendation com cota anônima; queries públicas.

## Áreas
- [Cliente @luanpoppe/ai](cliente-luanpoppe-ai.md) — pacote + `AiModels`; sem wrapper LangChain; factory faz `new AI()`.
- [Recomendação via IA](recomendacao-ia.md) — `POST /movie/recommendation`: invoke structured, tool `lookupMovies`, ids só no schema interno.
- [Agente e tool TMDB](agente-tool-tmdb.md) — lote de queries, prompt, factory do POST e strip HTTP dos ids.
- [Cota anônima e Bearer](cota-anonima-e-bearer.md) — 2 POSTs por `guest-id`; JWT ilimitado; `GET /movie/queries` sem cota.
- [Histórico de chat no Redis](historico-chat-redis.md) — checkpointer da lib (`threadId` = `chatid`), TTL de 20 min.
- [Exemplos de queries](exemplos-de-queries.md) — `GET /movie/queries` gera prompts de exemplo para a landing.
- [Lookup no catálogo TMDB](lookup-catalogo-tmdb.md) — serviço `MovieCatalogLookupService` sobre `IMovieCatalogProvider`; miss estruturado se o TMDB cair; tool de IA em `MovieCatalogLookupAiTool`.
