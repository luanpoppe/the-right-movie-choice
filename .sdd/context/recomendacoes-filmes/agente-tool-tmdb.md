# Agente de recomendação e tool TMDB

> Atualizado em 2026-09-05 · fontes: `AiMovieRecommendationProvider`, `MovieCatalogLookupAiTool`, `MovieRecommendationPrompts`, `MovieRecommendationController`, `MakeGetMovieRecommendationUseCaseFactory`

## O que é
No POST de recommendation o modelo chama a tool `lookupMovies` (lote de 1–8 queries) sobre o catálogo TMDB já existente. Ids TMDB/IMDb entram só no JSON interno do LLM; a resposta HTTP ao SPA continua `{ movies, response }` sem esses campos.

## Como funciona
- Schema: card público `SingleMovieReccomendationSchema`; interno estende com `tmdbId?` / `imdbId?`. O structured output valida o interno.
- Tool: `MovieCatalogLookupAiTool.createLookupMoviesTool()` — Zod só de input `{ queries }`; `execute` faz `Promise.all` de `MovieCatalogLookupService.findDetailsByTitle`.
- Prompt unificado pede mais candidatos que os 0–3 finais, **uma** chamada à tool, copiar ids se `found: true`.
- Provider: `callStructuredOutput` com `agent: { tools: [lookupMoviesTool] }` (tool injetada via `Params`).
- Factory do POST: `MakeTmdbHttpClientFactory` → `new MovieCatalogLookupService` → adapter → provider. GET `/movie/queries` não recebe a tool.
- Controller: `toPublicResponseBody` faz parse de cada filme no schema público antes do `send` (destructuring não remove ids nos itens).

## Decisões e porquês
- Ids no interno, não no HTTP — preparar dado sem vazar para o SPA agora. (origem: `tmdb-agent-tool`, 2026-09-05)
- Uma tool call em lote, lookup unitário no serviço — batch é contrato do agente, não da porta de catálogo. (origem: spec `agent-tmdb-tool-call`)
- Sem factory só para o serviço de lookup — um `new` no bootstrap do POST. (origem: revisão F1/F2)

## Notas
SPA inalterado. Parse inválido no strip do controller vira 500 do Fastify. GET de exemplos de query segue sem catálogo.
