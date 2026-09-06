# Spec: Lookup em lote no catálogo

> Parte de [`batch-catalog-lookup`](../../plan.md)

## Resumo

O `lookupMovies` deixa de disparar N× `findDetailsByTitle` em `Promise.all` para todos os itens. Passa a orquestrar em duas fases: (1) batch local (Postgres + Redis) para hits frescos; (2) `Promise.all` só nos misses, cada um pelo fluxo unitário atual (search TMDB + resolver). Novos métodos batch no repositório e no cache; API unitária preservada. Benchmark Vitest opt-in mede antes/depois.

## Requirements

### REQ-1: Lote com 8 hits locais frescos

- **Dado que** o agente chama `lookupMovies` com 8 queries cujos títulos existem no Postgres `pt-BR` com `updatedAt` há menos de 30 dias
- **Quando** a tool executa o lookup
- **Então** resolve os 8 no caminho batch (no máximo 2 round-trips Postgres + 1 round-trip Redis de leitura/escrita em lote)
- **E** não chama search TMDB
- **E** devolve 8 resultados `found: true` na **mesma ordem** das queries de entrada
- **E** aquece Redis para cada `tmdbId` retornado

### REQ-2: Lote misto — batch local + TMDB paralelo nos misses

- **Dado que** o agente envia 8 queries: 5 com hit local fresco e 3 sem linha correspondente (ou stale > 30 dias)
- **Quando** a tool executa o lookup
- **Então** as 5 com hit local resolvem na fase batch
- **E** as 3 restantes seguem `findDetailsByTitle` (search TMDB + `resolveByTmdbId`) em **`Promise.all` entre elas**
- **E** o array final tem 8 posições na ordem original, cada uma hit ou miss conforme o resultado individual

### REQ-3: Lote só com misses

- **Dado que** nenhuma query tem hit local fresco
- **Quando** a tool executa o lookup
- **Então** pula a fase batch com resultado vazio
- **E** dispara `Promise.all` com `findDetailsByTitle` para cada query (comportamento equivalente ao atual)
- **E** não degrada latência nem semântica em relação ao fluxo pré-batch

### REQ-4: Repositório batch por títulos

- **Entrada** `[{ query: "Interestelar", year: 2014 }, { query: "Duna", year: 2021 }]` em `pt-BR`, ambos existentes e frescos
- **Saída** mapa indexado pela posição de entrada com `MovieCatalogStoredRecord` (details + `updatedAt`) para cada hit
- **E** usa no máximo 1 query SQL para resolver ids (mesma regra `unaccent` + `ILIKE` + desempate `updatedAt` DESC de `findByTitleAndYear`)
- **E** 1 `findMany` com include das filhas para todos os ids encontrados
- **Erro** falha em uma query do lote não aborta as demais  ||  posição sem match retorna `null` no mapa

### REQ-5: Cache Redis em lote

- **Entrada** lista de pares `(tmdbId, language)` para leitura ou escrita de details
- **Saída** leitura via `MGET` (ou equivalente no wrapper `Redis`); escrita via pipeline de `SET` com TTL 24h (`TmdbCacheConstants.DETAILS_TTL_SECONDS`)
- **Erro** falha no batch de cache loga warn e não impede o retorno dos hits locais já resolvidos no Postgres

### REQ-6: API unitária preservada

- **Entrada** chamada isolada a `MovieCatalogLookupService.findDetailsByTitle({ query: "Interestelar" })`
- **Saída** mesmo comportamento e contrato de antes desta feature (sem exigir passar pelo batch)
- **Erro** nenhum call site existente fora do `lookupMovies` precisa mudar

### REQ-7: Benchmark Vitest antes/depois

- **Entrada** projeto Vitest separado (ex. `--project catalog-lookup-bench`), opt-in como `test:tmdb-live`, com fixture de 8 filmes seedados no Postgres
- **Saída** relatório no stdout com tempo médio/mediana do caminho batch vs unitário  ||  números de uma medição local podem ir para o README depois, não ficam commitados no arquivo de benchmark
- **Erro** benchmark não roda no `pnpm test` padrão da CI (projeto `unit`)

## Edge cases

- Query vazia num item do lote: miss na posição (“Informe o nome…”), sem TMDB; demais itens seguem normalmente.
- Idioma por query (`language` opcional): batch agrupa/respeita idioma por item; default `pt-BR`.
- Registro stale (> 30 dias) ou ausente no Postgres: conta como miss da fase 1 e vai para fase 2 (`findDetailsByTitle`).
- Falha Postgres no batch: log + trata posições afetadas como miss da fase 1 (fallback TMDB unitário), sem derrubar o lote inteiro.
- Ordem do array de retorno sempre espelha a ordem de `queries` de entrada, independente de hit/miss.

## Contratos expostos

- Tool do agente (inalterada): `packages/backend/src/domains/movies/infrastructure/providers/movie-catalog-lookup.ai-tool.ts` (`lookupMovies` — schema Zod e array de `MovieCatalogLookupResult`).
- Novo batch no serviço: `packages/backend/src/domains/movies/infrastructure/providers/movie-catalog-lookup.service.ts:MovieCatalogLookupService.findDetailsByTitlesBatch`
- Novo batch no repositório: `IMovieCatalogRepository.findByTitlesAndYears` (ou equivalente na implementação).
- Novo batch no cache: métodos `getMany` / `setMany` em `TmdbMovieDetailsCache`.
