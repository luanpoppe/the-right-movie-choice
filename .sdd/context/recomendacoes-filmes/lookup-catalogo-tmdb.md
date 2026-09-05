# Lookup de filme no catálogo

> Atualizado em 2026-09-05 · fontes: `MovieCatalogLookupService`, `MovieCatalogLookupResult`, `MovieCatalogLookupAiTool`

## O que é
Serviço acima de `IMovieCatalogProvider`: busca por título (+ ano opcional), pega o primeiro hit e devolve `MovieCatalogDetails` (ids TMDB e IMDb inclusos). A tool que o agente chama é outra classe (`MovieCatalogLookupAiTool` / `lookupMovies`).

## Como funciona
- Input `{ query, year? }`. Query vazia → `{ found: false }` sem HTTP.
- Search: se `year` veio, o texto é `"${query} ${year}"`. Primeiro `results[0]`; lista vazia → miss, sem details.
- Sucesso: `getMovieDetails` → `{ found: true, details }` mesmo com `imdbId` null.
- `TmdbHttpException` e erro inesperado: log (`durationMs`, `success`, mensagem, sem body de prompt) e `{ found: false }` — não relança.
- Composição: `new MovieCatalogLookupService(catalog)` no bootstrap da recommendation (sem factory só para um `new`).

## Decisões e porquês
- Reusa a porta de catálogo, não um client HTTP novo — porque TMDB já tem retry, Zod e cache de details. (origem: `tmdb-agent-tool`, 2026-09-05)
- Miss estruturado em vez de throw — para o POST de recommendation continuar quando o TMDB cai. (origem: spec REQ-3)
- Nome `*Tool` só no adapter da IA — o serviço unitário é `findDetailsByTitle`. (origem: revisão F2.C2, 2026-09-05)

## Notas
O wiring `callStructuredOutput` / prompt / schema interno ainda é a feature `agent-tmdb-tool-call`.
