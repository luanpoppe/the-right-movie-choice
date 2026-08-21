# Recomendação via IA
> Atualizado em 2026-08-21 · fontes: `domains/movies`, `lib/langchain`, `app.ts`

## O que é
O núcleo do produto: o usuário descreve o que quer assistir em linguagem natural e a API devolve até 3 filmes estruturados mais uma resposta conversacional. Não exige autenticação hoje.

## Como funciona
- HTTP: `moviesControllers` registra `POST /movie/recommendation` (`routes.ts`). O controller exige header `chatid` (`HeadersDTOSchema`); falta dele vira `MissingHeaderException`.
- Caso de uso: `GetMovieRecommendationUseCase` carrega o histórico, pede filmes estruturados, gera o texto do chat e persiste o turno.
- Provider: `LangchainMovieRecommendationProvider` implementa `IMovieRecommendationProvider` via `Langchain` (`callWithStructuredOutput` + `call`) com Gemini (`GEMINI_API_KEY`). Schema Zod; schema inválido → `WrongMovieSchemaFromLlmException`.
- Bootstrap: `MakeGetMovieRecommendationUseCaseFactory`. Swagger via `MovieRecommendationDocs` + `fastify-type-provider-zod`.

## Decisões e porquês
- Duas chamadas ao LLM (JSON estruturado, depois texto) — separar dados de filme da prosa conversacional, validáveis com Zod.
- Rotas de filme públicas — middleware Bearer ainda não existe (próximo passo no README).
- Contexto em `src/domains/movies` (legado) vs `src/modules/*` (users/auth) — mesmo estilo de camadas, pastas diferentes.

## Notas
Frontend chama via `MovieRecommendationService` (axios + header `chatId`). CORS libera o header `chatId`.
