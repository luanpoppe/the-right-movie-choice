# Exemplos de queries
> Atualizado em 2026-08-21 · fontes: `GetMoviesQueryExamplesUseCase`, `LangchainMoviesQueryExamplesProvider`, `movies-query-examples.controller.ts`

## O que é
Endpoint que pede à IA uma lista criativa de prompts de busca, usada na landing para o usuário começar a conversa sem inventar o texto do zero.

## Como funciona
- `GET /movie/queries` → `moviesQueryExamplesController` → `GetMoviesQueryExamplesUseCase` → `LangchainMoviesQueryExamplesProvider`.
- Factory: `MakeGetMoviesQueryExamplesUseCaseFactory`. Docs: `MoviesQueryExamplesDocs`.
- No frontend: `MoviesQueryExamplesService` alimenta `InputSuggestions` na welcome.

## Decisões e porquês
- Endpoint separado da recomendação — geração de exemplos não precisa de `chatid` nem grava histórico.
- Mesmo stack LangChain/Gemini — consistência com o bounded context de filmes.

## Notas
Rota pública. Falha da LLM cai no error handler global do Fastify (`app.ts`).
