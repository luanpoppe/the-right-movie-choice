# Spec: Buscas e details TMDB

> Parte de [`tmdb-client`](../../plan.md)

## Resumo

Expõe catálogo tipado: Zod + mapper para DTOs da aplicação, cache Redis só de **details** (24h), GETs de debug em `dev`/`test` **só desta máquina** (loopback). Sem tools do chat e sem cache de search.

## Requirements (cenários BDD)

### REQ-1: Search devolve hits, não ficha

- **Dado que** o adapter TMDB responde 200 no `/search/movie`
- **Quando** `searchMovies` (ou `GET /debug/tmdb/search?query=…`) é chamado
- **Então** o resultado é `{ page, results: MovieSearchHit[] }` (id, título, ano, poster, overview), sem créditos/providers; `page` default 1; sem `include_adult` na query TMDB

### REQ-2: Details mapeado + cache miss

- **Dado que** Redis não tem `catalog:movie:{id}:{lang}`
- **Quando** `getMovieDetails` (ou `GET /debug/tmdb/movies/:id`) é chamado
- **Então** busca TMDB, Zod + mapper → `MovieCatalogDetails` (médio: hit + runtime, gêneros, nota TMDB, países; direção + até 5 atores; providers BR; IMDb id), grava Redis TTL 24h **sem** renovar no hit

### REQ-3: Details cache hit

- **Dado que** a chave Redis existe com o DTO JSON
- **Quando** details é pedido de novo
- **Então** não chama TMDB; devolve o DTO cacheado; TTL restante não é resetado

### REQ-4: Debug só nesta máquina (loopback)

- **Dado que** `NODE_ENV` é `dev` ou `test` e o cliente é **loopback** (a própria máquina: `127.0.0.1` / `::1` / `localhost` — não é LAN `192.168…` nem IP público)
- **Quando** `GET /debug/tmdb/search` ou `GET /debug/tmdb/movies/:id`
- **Então** responde o DTO; em `prod` as rotas **não são registradas**; pedido de outro IP → recusa (não é JWT). Postman contra `http://localhost` passa; alguém na internet batendo no servidor em `dev` não usa a API como proxy da TMDB.

## Edge cases

- Zod da resposta TMDB falha → `TmdbHttpException` **502 Bad Gateway**: nosso backend é o gateway; a TMDB (upstream) mandou corpo que não dá para confiar. Não é 400 (input do usuário) nem 500 (bug nosso). Mesmo código do JSON inválido / 401 da TMDB no client HTTP.
- Redis indisponível na leitura/escrita → log, segue para TMDB, **não** grava cache (degrada).
- TMDB 404 no details → 404; search vazio → lista `[]`.
- `query` ausente/vazia no debug search → 400.
- Live: script `pnpm test:tmdb-live` (ou equivalente) só com `TMDB_ACCESS_TOKEN`; job `pnpm test` **não** dispara live.
- `Redis.get()` legado devolve `[]` no miss — cache **não** usa isso; miss explícito (`getString`/null).

## Contratos

- Porta: `searchMovies` → `{ page, results: MovieSearchHit[] }`; `getMovieDetails` → `MovieCatalogDetails`.
- Debug: `GET /debug/tmdb/search?query=&page=`; `GET /debug/tmdb/movies/:id`.
- Redis: `catalog:movie:{id}:{lang}` (lang `pt-BR`); valor = DTO mapeado; TTL 24h; sem refresh no GET.
- Providers: fatia `BR` de `watch/providers`; créditos: crew `Director` + 5 elenco (ordem TMDB).
- Rotas debug **não** em `prod`. Chat/LangChain fora desta feature.
