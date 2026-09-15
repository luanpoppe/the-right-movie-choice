# Exemplos de queries
> Atualizado em 2026-09-14 · fontes: `GetMoviesQueryExamplesUseCase`, `PoolFirstMovieQueryExamplesProvider`, `AiMoviesQueryExamplesProvider`, `movies-query-examples.controller.ts`

## O que é
Endpoint que devolve **3** prompts de busca para a landing. A fonte preferencial é o pool persistido no Postgres; se o pool não tiver dados suficientes ou falhar, cai na geração via IA.

## Como funciona
- `GET /movie/queries` → `moviesQueryExamplesController` → `GetMoviesQueryExamplesUseCase` → `PoolFirstMovieQueryExamplesProvider`.
- Factory: `MakeGetMoviesQueryExamplesUseCaseFactory` monta `PoolFirstMovieQueryExamplesProvider(repository, AiMoviesQueryExamplesProvider)` com `AiConfigBuilder` compartilhado.
- **Pool-first:** se `count >= 3`, `pickRandomTexts(3)` e mapeia para `{ queryExamples: [{ queryExample }] }`. Resposta validada com `MovieQueryExamplesSchema`; inválida → fallback IA (`invalid_pool_response`).
- **Fallback IA:** pool com menos de 3 itens, erro Postgres ou parse inválido → `AiMoviesQueryExamplesProvider` (uma `callStructuredOutput`, temperature `1.2`, exatamente 3 itens). Falha → `WrongMovieSchemaFromLlmException`.
- No frontend: `MoviesQueryExamplesService` alimenta `InputSuggestions` na welcome.

## Decisões e porquês
- Endpoint separado da recomendação — não precisa de `chatid` nem grava histórico.
- Pool parcial (< 3) não mistura com IA — cai no fluxo IA inteiro como pool vazio. (origem: spec pool-read-api)
- Contrato HTTP inalterado — sempre 3 `queryExample` no JSON. (origem: query-suggestions-pool)

## Notas
Rota pública, sem cota. Popule o pool com `pnpm seed:query-suggestions` (ou `pnpm db:migrate`, que encadeia o seed). Detalhes do pool em [pool-sugestoes-busca.md](pool-sugestoes-busca.md).
