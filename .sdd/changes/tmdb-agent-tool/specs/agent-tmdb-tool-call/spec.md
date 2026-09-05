# Spec: Agente chama a tool TMDB

> Parte de [`tmdb-agent-tool`](../../plan.md)

## Resumo

O POST de recommendation passa uma tool Zod ao `@luanpoppe/ai`: o modelo pensa em mais candidatos do que vai devolver, faz **uma** chamada com até 8 `{ query, year? }`, o adapter dispara `Promise.all` em `MovieCatalogLookupService.findDetailsByTitle`. O JSON interno pode trazer `tmdbId`/`imdbId` opcionais; o HTTP público continua `{ movies, response }` sem esses campos. GET `/movie/queries` não recebe a tool.

## Requirements (cenários BDD)

### REQ-1: Uma chamada batch, lookups em paralelo

- **Dado que** o `AiMovieRecommendationProvider` registra a tool no `callStructuredOutput` (Zod de input, `execute` chama a tool de F1)
- **Quando** o modelo invoca a tool com `{ queries: [{ query, year? }, ...] }` (1–8 itens)
- **Então** o adapter faz `Promise.all` de `lookup` por item e devolve um array de `MovieCatalogLookupResult` **na mesma ordem** das queries (hits e misses)

### REQ-2: Schema interno com ids; modelo copia do retorno

- **Dado que** o structured output usa o schema de recommendation **estendido** (`tmdbId` number opcional, `imdbId` string opcional em cada filme)
- **Quando** o modelo escolhe até 3 filmes depois da tool
- **Então** preenche ids a partir do array devolvido (não inventa); filme sem hit pode ir no JSON **sem** ids — o parse não falha

### REQ-3: HTTP público não vaza ids

- **Dado que** o use case devolve a entidade interna (filmes podem ter `tmdbId`/`imdbId`)
- **Quando** o `MovieRecommendationController` monta o body
- **Então** cada filme é mapeado para o schema **público** (campos atuais de `SingleMovieReccomendationSchema`); `tmdbId`/`imdbId` não entram no JSON. Destructuring `{ movies, response }` **não** basta — itens extras vazariam

### REQ-4: Prompt ensina batch e escolha

- **Dado que** o system prompt unificado é o que o modelo lê
- **Quando** há pedido de recomendação
- **Então** o texto pede: pensar em mais títulos do que os até 3 finais; **uma** chamada à tool com todas as queries; só então escolher 0–3 e copiar ids do retorno. Sem markdown no `response`

## Edge cases

- Array `queries` vazio ou acima de 8: o Zod da tool rejeita (min 1, max 8); o modelo precisa corrigir ou seguir sem catálogo.
- Item com query vazia: o `lookup` de F1 já devolve `{ found: false }` — o índice no array ainda existe.
- Tool não chamada: recommendation segue; ids ausentes; HTTP igual ao de hoje.
- `found: false` no índice: o filme correspondente pode ser sugerido sem ids.
- Falha de um `lookup` não cancela os outros: cada item já captura TMDB; `Promise.all` não relança.
- GET `/movie/queries`: sem esta tool, sem ids no schema de exemplos.
- DTO HTTP **não** reutiliza o Zod interno estendido — schema público separado (ou omit explícito no controller).

## Contratos

- Tool no AI: Zod **só de input** `{ queries: { query: string; year?: number }[] }` (1–8). Output do `execute` = `MovieCatalogLookupResult[]` (não precisa Zod de output).
- `MovieCatalogLookupService.findDetailsByTitle` **não muda** (unitário). Batch só no adapter.
- Entidade interna: `packages/backend/src/domains/movies/domain/entities/movie-recommendation.entity.ts` — campos extras `tmdbId?`, `imdbId?`.
- Público: `movie-recommendation.dto.ts` / resposta do POST — mesmos campos de hoje, sem ids.
- Wiring: factory de recommendation instancia catálogo + lookup tool + tool Zod; **não** a factory de query examples.
- Prompt: `movie-recommendation-prompts.ts`.
- Nome da tool no modelo: estável e descritivo (ex. `lookupMovies`); `description` diz que é uma chamada com várias queries em paralelo.
