# Recomendação via IA
> Atualizado em 2026-09-04 · fontes: `AiMovieRecommendationProvider`, `MakeGetMovieRecommendationUseCaseFactory`, `GetMovieRecommendationUseCase`

## O que é
O núcleo do produto: o usuário descreve o que quer assistir em linguagem natural e a API devolve até 3 filmes estruturados mais uma resposta conversacional. Visitante tem cota de 2 POSTs; logado (Bearer válido) é ilimitado.

## Como funciona
- HTTP: `moviesControllers` registra `POST /movie/recommendation` via `MakeMovieRecommendationHttpFactory` (hook + controller com a mesma cota). Header `chatid` obrigatório; no 200 anônimo incrementa cota, cookie `guest-id` e `X-Guest-Remaining`.
- Caso de uso: `GetMovieRecommendationUseCase` pede filmes estruturados e o texto do chat com o mesmo `chatId`. Não lê/grava histórico. Porta `IMovieRecommendationProvider` com `chatId` (duas chamadas).
- Provider: `AiMovieRecommendationProvider` recebe `AI` injetado. `callStructuredOutput` + `safeParse(result.response)`; `call` devolve `text`. Prompts em `MovieRecommendationPrompts`. `threadId` nas calls. Schema inválido → `WrongMovieSchemaFromLlmException`.
- Bootstrap: `MakeGetMovieRecommendationUseCaseFactory.create()` faz um `new AI(config)` por request (`buildAiConfig` omite chaves vazias; Gemini + fallback só se a chave existir; `memory` Redis só nesta factory).

## Decisões e porquês
- Duas chamadas ao LLM (JSON estruturado, depois texto) — use case/porta atuais. Unificar numa chamada é follow-up, fora da migração de runtime.
- OpenRouter primário (`AiModels.PRIMARY`); Gemini só como fallback da lib se `GEMINI_API_KEY` não for vazia.
- Sem wrapper/`AiClient` — a lib já é facade.
- Logs de modelo/`durationMs`/erro nos adapters, sem body de prompt.

## Notas
Frontend chama via `MovieRecommendationService` (axios + header `chatId`). CORS libera `chatId` e expõe `X-Guest-Remaining`. `GET /movie/queries` usa o mesmo runtime (`AiMoviesQueryExamplesProvider`).
