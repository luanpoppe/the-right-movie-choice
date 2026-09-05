# Exemplos de queries
> Atualizado em 2026-09-04 · fontes: `GetMoviesQueryExamplesUseCase`, `AiMoviesQueryExamplesProvider`, `MakeGetMoviesQueryExamplesUseCaseFactory`, `movies-query-examples.controller.ts`

## O que é
Endpoint que pede à IA uma lista criativa de prompts de busca, usada na landing para o usuário começar a conversa sem inventar o texto do zero.

## Como funciona
- `GET /movie/queries` → `moviesQueryExamplesController` → `GetMoviesQueryExamplesUseCase` → `AiMoviesQueryExamplesProvider`.
- Factory: `MakeGetMoviesQueryExamplesUseCaseFactory` faz um `new AI(config)` por request (`buildAiConfig` privado, duplicado da recommendation, sem Redis).
- Provider: uma `callStructuredOutput` em `AiModels.PRIMARY`, temperature constante `1.5`, prompt como `AIMessages.human` (não system). Schema `MovieQueryExamplesSchema`; falha → `WrongMovieSchemaFromLlmException`.
- No frontend: `MoviesQueryExamplesService` alimenta `InputSuggestions` na welcome.

## Decisões e porquês
- Endpoint separado da recomendação — geração de exemplos não precisa de `chatid` nem grava histórico.
- Mesmo runtime `@luanpoppe/ai` da recommendation; `buildAiConfig` não foi extraído para util compartilhado nesta feature.
- `cache: false` do Gemini FLASH_LITE não tem equivalente na chamada OpenRouter — não recriado.

## Notas
Rota pública. Falha da LLM cai no error handler global do Fastify (`app.ts`). Logs de modelo/`durationMs` sem body.
