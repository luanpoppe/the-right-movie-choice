# Tool TMDB no agente de recomendação

> **id**: `tmdb-agent-tool` · **criada**: 2026-09-05 · **idioma**: pt-BR

## Contexto

O agente de recomendação hoje devolve filmes estruturados sem ids de catálogo. Esta mudança faz o modelo consultar o TMDB via tool (sobre a porta já existente) para obter dados incluindo id TMDB e IMDb, guardados só no schema interno — a API pública e o SPA não consomem isso ainda; o dado existe para features futuras.

## Decisões macro

- **Decisão**: reutilizar `IMovieCatalogProvider` / `TmdbHttpClient` (search + details). **Por quê**: catálogo, cache, Zod e `imdbId` já existem; memória do projeto pede porta por operação. **Alternativa descartada**: client HTTP novo só para a tool.
- **Decisão**: ids entram no JSON interno do structured output; o contrato HTTP público `{ movies, response }` não muda. **Por quê**: preparar o dado sem vazar para o SPA agora. **Alternativa descartada**: só logar, ou expor ids na API nesta mudança.
- **Decisão**: duas features, inside-out — tool primeiro, wiring no agente depois. **Por quê**: a tool valida contra o catálogo sozinha; o agente depende dela. **Alternativa descartada**: uma feature só, ou ordem invertida.
- **Decisão**: backend de recomendação + prompt (o modelo precisa saber usar a tool). **Por quê**: tool sem instrução no prompt não é chamada de forma confiável. **Alternativa descartada**: só código, sem mexer no prompt.

## Features (executadas sequencialmente)

1. **tmdb-lookup-tool** — Tool de busca no catálogo TMDB já existente, devolvendo informações incluindo ids TMDB e IMDb.
2. **agent-tmdb-tool-call** — O agente de recomendação chama essa tool, o prompt ensina o uso, e os ids ficam no schema interno sem alterar a API pública.

## Escopo

**Dentro**: tool sobre `IMovieCatalogProvider`; wiring no `AiMovieRecommendationProvider` / `callStructuredOutput`; ajuste de prompt; schema interno com ids; strip/omit na resposta HTTP pública.

**Fora**: SPA; mudança do JSON público `{ movies, response }`; persistência de ids (Postgres/Redis dedicado); client TMDB novo; posters / watch providers na UI; GET debug extra da tool.
