# Recomendação via IA
> Atualizado em 2026-09-05 · fontes: `AiMovieRecommendationProvider`, `MakeGetMovieRecommendationUseCaseFactory`, `GetMovieRecommendationUseCase`, `MovieRecommendationController`

## O que é
O núcleo do produto: o usuário descreve o que quer assistir em linguagem natural e a API devolve até 3 filmes estruturados mais uma resposta conversacional. Visitante tem cota de 2 POSTs; logado (Bearer válido) é ilimitado.

## Como funciona
- HTTP: `moviesControllers` registra `POST /movie/recommendation` via `MakeMovieRecommendationHttpFactory` (hook + controller com a mesma cota). Header `chatid` obrigatório; no 200 anônimo incrementa cota, cookie `guest-id` e `X-Guest-Remaining`. O JSON continua `{ movies, response }`.
- Caso de uso: `GetMovieRecommendationUseCase.execute` chama uma vez `IMovieRecommendationProvider.getMovieRecommendation(userMessage, chatId)` e devolve `{ movies, response }` da entidade. Não lê/grava histórico.
- Provider: `AiMovieRecommendationProvider` recebe `Params` `{ ai, lookupMoviesTool }`. Uma `callStructuredOutput` (`AiModels.PRIMARY`, `threadId: chatId`, turno atual, schema interno, prompt unificado, `agent.tools`). `safeParse(result.response)`; schema inválido → `WrongMovieSchemaFromLlmException`. Sem `ai.call`.
- Envelope Zod interno: `movies` 0–3 + `response` nonempty, com `tmdbId`/`imdbId` opcionais. HTTP público stripa esses ids no controller.
- Bootstrap: `MakeGetMovieRecommendationUseCaseFactory.create()` faz `new AI(config)` + catálogo TMDB + `lookupMovies` por request (`buildAiConfig` omite chaves vazias; Gemini + fallback só se a chave existir; `memory` Redis só nesta factory).

## Decisões e porquês
- Uma invoke structured (cards + texto no mesmo JSON) — custo/latência e um único `threadId`; HTTP/SPA inalterados. (origem: `single-recommendation-call`, 2026-09-04)
- OpenRouter primário (`AiModels.PRIMARY`); Gemini só como fallback da lib se `GEMINI_API_KEY` não for vazia.
- Sem wrapper/`AiClient` — a lib já é facade.
- Logs de modelo/`durationMs`/erro nos adapters, sem body de prompt.

## Notas
Frontend chama via `MovieRecommendationService` (axios + header `chatId`). CORS libera `chatId` e expõe `X-Guest-Remaining`. `GET /movie/queries` usa o mesmo runtime (`AiMoviesQueryExamplesProvider`).
