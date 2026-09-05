# Spec: Tool de lookup TMDB

> Parte de [`tmdb-agent-tool`](../../plan.md)

## Resumo

Uma tool no domínio `movies` consulta o catálogo já existente: `searchMovies` + `getMovieDetails` no primeiro hit. Sucesso devolve `MovieCatalogDetails` completo. Search vazia, query vazia ou TMDB fora (`TmdbHttpException`) devolvem `{ found: false }` — a tool não derruba o turno da IA, para o agente responder com o que já sabe.

## Requirements (cenários BDD)

### REQ-1: Lookup com match

- **Dado que** `IMovieCatalogProvider.searchMovies` devolve ao menos um hit
- **Quando** a tool é invocada com `query` (e `year` opcional como filtro `primary_release_year` na search)
- **Então** chama `getMovieDetails` com o `id` do primeiro hit e devolve `{ found: true, details }` no formato de `MovieCatalogDetails` (incluindo `id` TMDB e `imdbId`)

### REQ-2: Search sem resultados

- **Dado que** a search devolve `results` vazio
- **Quando** a tool é invocada
- **Então** não chama `getMovieDetails` e devolve `{ found: false, message }` (não lança)

### REQ-3: TMDB fora não quebra o turno

- **Dado que** `searchMovies` ou `getMovieDetails` lança `TmdbHttpException` (timeout, 502, etc.)
- **Quando** a tool é invocada
- **Então** captura a falha, devolve `{ found: false, message }` e **não** relança — o agente segue e responde com o que já sabe (sem ids de catálogo neste turno)

## Edge cases

- `year` ausente: search só com `query`.
- `year` presente: o texto da search continua só o `query`; a porta envia `primary_release_year` (ex.: query `Interestelar`, year `2014`).
- `imdbId` null no details: ainda é `{ found: true, details }` — o catálogo já admite IMDb ausente.
- `query` vazia (`StringUtils.isEmptyString`): `{ found: false, message }`, sem chamar a porta.
- Logar a `TmdbHttpException` (sem body de prompt) e ainda assim devolver `found: false`.
- Wiring no `@luanpoppe/ai` / prompt / schema interno da recommendation: fora desta feature (`agent-tmdb-tool-call`); o contrato `found: false` é o que permite o agente continuar.

## Contratos

- Input: `{ query: string; year?: number }`.
- Output sucesso: `{ found: true; details: MovieCatalogDetails }` — tipo em `packages/backend/src/domains/movies/domain/entities/movie-catalog-details.entity.ts`.
- Output sem match **ou** catálogo indisponível: `{ found: false; message: string }` (nunca throw da tool).
- Porta: `IMovieCatalogProvider.searchMovies(query, page?, year?)` — `year` vira `primary_release_year` no `TmdbHttpClient`.
- Código do serviço: `packages/backend/src/domains/movies/infrastructure/` (não `modules/tmdb`, não `lib/ai`).
- Params da factory: tipo `Params`, não `Deps`.
- Testes unitários: pasta `specs/` no nível da unidade; sem live TMDB no `pnpm test` da CI.
