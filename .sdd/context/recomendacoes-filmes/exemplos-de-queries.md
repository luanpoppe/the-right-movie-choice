# Exemplos de queries
> Atualizado em 2026-09-05 · fontes: `GetMoviesQueryExamplesUseCase`, `AiMoviesQueryExamplesProvider`, `MovieQueryExamplesPrompts`, `MovieQueryExamplesSchema`, `movies-query-examples.controller.ts`

## O que é
Endpoint que pede à IA uma lista criativa de prompts de busca, usada na landing para o usuário começar a conversa sem inventar o texto do zero.

## Como funciona
- `GET /movie/queries` → `moviesQueryExamplesController` → `GetMoviesQueryExamplesUseCase` → `AiMoviesQueryExamplesProvider`.
- Factory: `MakeGetMoviesQueryExamplesUseCaseFactory` faz um `new AI(config)` por request (`buildAiConfig` privado, duplicado da recommendation, sem Redis).
- Provider: uma `callStructuredOutput` em `AiModels.PRIMARY`, temperature constante `1.2`, prompt humano (não system). Schema `MovieQueryExamplesSchema`: exatamente 3 itens (`MOVIE_QUERY_EXAMPLES_COUNT`); o DTO HTTP `queries` tem o mesmo length. Falha → `WrongMovieSchemaFromLlmException`.
- Prompt: três buscas curtas em inglês, variadas, para a landing; só filme/série/anime no sentido de “algo para assistir”.
- No frontend: `MoviesQueryExamplesService` alimenta `InputSuggestions` na welcome.

## Decisões e porquês
- Endpoint separado da recomendação — geração de exemplos não precisa de `chatid` nem grava histórico.
- Mesmo runtime `@luanpoppe/ai` da recommendation; `buildAiConfig` não foi extraído para util compartilhado nesta feature.
- Temperature `1.2` e `.length(3)` no Zod — o prompt pede 3 chips; o parse rejeita outro tamanho. (origem: ajuste de prompt, 2026-09-05)

## Notas
Rota pública. Falha da LLM cai no error handler global do Fastify (`app.ts`). Logs de modelo/`durationMs` sem body.
