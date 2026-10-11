# Tool de busca no catálogo (agente)

> Atualizado em 2026-10-09 · fontes: mudança `movie-catalog-search` (feature `agent-search-tool`)

## O que é

Tool `searchCatalog` que dá ao agente de recommendation a mesma busca de catálogo do TMDB ao vivo — por texto/populares ou por filtros de discover escalares (gênero, nota, anos, duração, certificação). Convive com a `lookupMovies`.

## Como funciona

- `SearchCatalogAiTool` (`infrastructure/providers/search-catalog.ai-tool.ts`) embrulha `SearchCatalogMoviesUseCase` e `DiscoverCatalogMoviesUseCase` numa agent tool (`AITools.createTool`), no molde da `lookupMovies`.
- Modo: `query` de texto → busca por texto; qualquer filtro de discover (`genres`/`minRating`/anos/duração/certificação) → discover; nenhum → populares. Texto e discover **não se misturam** (miss de validação).
- Entrada: `MovieCatalogSearchToolInputSchema` (entity, estrutural). Retorno: `{ found, results: [{ id, title, year, overview, posterUrl }], notice? }`, com `posterUrl` absoluto via `TmdbPosterUtils.buildPosterUrl`.
- Nunca lança: schema inválido, validação do discover (`MovieCatalogSearchValidationException`) e falha do TMDB (`TmdbHttpException`) viram **miss estruturado** (`found: false` + `notice`); lista vazia é `found: true` com aviso.
- Wiring: a factory de recommendation instancia os use cases (com `catalog` + `enqueuePersist`) e a tool; o provider manda `agent.tools = [lookupMovies, searchCatalog]`.
- Gênero por **ids numéricos** do TMDB (a descrição da tool lista os comuns).

## Decisões e porquês

- **Uma tool com dois modos**, em vez de duas — menos tools no contexto do modelo.
- **Convive com `lookupMovies`**: uma é local-first por título, a outra é busca ao vivo com filtros; o modelo escolhe.
- **Hits enxutos** (id, título, ano, overview, pôster): basta para o modelo decidir; a ficha completa vem depois via lookup.
- **Idioma por chamada** (`en-US` default, `pt-BR`).
- **Miss estruturado** em vez de exceção — não derruba o turno do chat.

## Notas

- A fila de gravação do catálogo acontece dentro dos use cases (a tool não faz nada a mais).
- A tool reusa a validação do discover; o schema da tool é só estrutural.
