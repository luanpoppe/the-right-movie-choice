# Spec: Unificar call de recomendação

> Parte de [`single-recommendation-call`](../../plan.md)

## Resumo

Uma invoke `callStructuredOutput` devolve cards e texto conversacional. Porta e use case passam a um método; `POST /movie/recommendation` continua `{ movies, response }`.

## Requirements (cenários BDD)

### REQ-1: Uma invoke, dois resultados

- **Dado que** o usuário envia `userMessage` com `chatId`
- **Quando** `GetMovieRecommendationUseCase.execute` roda
- **Então** o provider faz **uma** `callStructuredOutput` (`AiModels.PRIMARY`, `threadId: chatId`, `messages` só o turno atual)
- **E** **não** chama `ai.call` de texto
- **E** o use case devolve `{ movies, response }` para o controller (mesmo shape HTTP)

### REQ-2: Schema Zod unificado

- **Dado que** a lib devolve `result.response`
- **Quando** o adapter faz `safeParse`
- **Então** o schema é `movies` (`SingleMovieReccomendationSchema`, `.min(0).max(3)`) **e** `response` (`z.string().nonempty()`)
- **E** parse falho → `WrongMovieSchemaFromLlmException` (inclui `response` vazio ou mais de 3 filmes)

### REQ-3: Porta com um método

- **Dado que** `IMovieRecommendationProvider` existe
- **Quando** esta feature fecha
- **Então** só `getMovieRecommendation(userMessage, chatId)` devolve entidade com `movies` + `response`
- **E** somem `getStructuredMoviesRecommendation` e `getChatResponse`

### REQ-4: Prompt único

- **Dado que** `MovieRecommendationPrompts` monta o system prompt
- **Quando** a invoke roda
- **Então** há **uma** função de prompt (regras dos cards + tom do chat: curto, sem markdown, não falar que “outra IA” escolheu)
- **E** `structured()` / `chat(moviesJson)` não restam como API usada

## Edge cases

- Zero filmes + `response` nonempty → 200 com `movies: []` (esclarecer/recusar).
- Quatro filmes no JSON → falha de schema.
- `response` `""` → `WrongMovieSchemaFromLlmException`.
- Lib lança por `threadId` ausente → adapter **não** engole.
- Factory/`memory` Redis inalterados; HTTP/DTO/SPA/cota inalterados.

## Contratos

- Entidade/schema: `movie-recommendation.entity.ts` (hoje só `{ movies }`).
- Porta: `IMovieRecommendationProvider.getMovieRecommendation`.
- HTTP: `MovieRecommendationResponseDTOSchema` já é `{ movies, response }` — não mudar.
- Invoke: `AICallParams` + `outputSchema` do envelope unificado; sem segunda call.
