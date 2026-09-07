# Pipeline exclude-watched na recommendation

> Atualizado em 2026-09-07 · fontes: `make-get-movie-recommendation-use-case.factory.ts`, `ai-movie-recommendation.provider.ts`, `movie-catalog-lookup.ai-tool.ts`, `exclude-watched-recommendation.sanitizer.ts`

## O que é

Para usuários autenticados, o POST `/movie/recommendation` pode excluir filmes já assistidos (`UserMovieEntry.watched`). O backend amplia o pool de candidatos, filtra após lookup no catálogo e repete até obter pelo menos 2 filmes com `tmdbId` verificado como não-assistido — ou esgota 5 rodadas.

## Como funciona

1. **Controller** (`movie-recommendation.controller.ts`): autenticado sem flag → `excludeWatched: true`; anônimo ignora a flag. Resolve opções e chama `MakeGetMovieRecommendationUseCaseFactory.create(useCaseOptions)` por request.
2. **Factory**: instancia `PrismaUserMovieEntryRepository`, passa `userId`/`excludeWatched`/repo para `MovieCatalogLookupAiTool` (modo exclude) e injeta o repo no use case.
3. **Use case**: repassa `userId`, `excludeWatched` e `userMovieEntryRepository` ao provider quando em modo exclude.
4. **Tool `lookupMovies`**: até 25 queries; após batch, `WatchedMovieFilterUtils` substitui hits assistidos por `{ found: false }` na mesma posição (preserva mapeamento query↔índice).
5. **Provider**: até 5 rodadas `callStructuredOutput` com prompt `unifiedExcludeWatched`; sanitização final remove assistidos do JSON; contexto de exclusão entre rodadas evita repetição.

Constantes em `ExcludeWatchedRecommendationConstants`: pool 25, mínimo 2 verificados, teto 5 rodadas.

## Decisões e porquês

- Filtro na tool (não serviço separado) — ponto único antes de devolver resultados à IA. (origem: `chat-exclude-watched` plan, 2026-09-06)
- Retry no provider (backend), não no LLM — rodada = chamada estruturada completa + sanitize + critério de 2 verificados. (origem: spec grill, 2026-09-07)
- Default `excludeWatched: true` para autenticado — melhor UX; `false` preserva fluxo legado 4–8 candidatos. (origem: spec REQ-5)
- Aviso de esgotamento via instrução ao LLM na rodada final — sem string fixa em PT no servidor. (origem: spec REQ-4, grill)
- Wiring do repo só na factory (F1.C8) — controller/use case não instanciam Prisma diretamente.

## Notas

- Modo exclude exige três condições no provider: `excludeWatched + userId válido + userMovieEntryRepository`.
- Filmes sem `tmdbId` na resposta final não entram no critério de retry nem na sanitização por assistido.
- `excludeWatched: false` mantém `MAX_QUERIES = 8` na tool e prompt unificado legado.
