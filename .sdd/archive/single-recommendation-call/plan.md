# Uma call de recomendação (texto + cards)

> **id**: `single-recommendation-call` · **criada**: 2026-09-04 · **idioma**: pt-BR

## Contexto

O POST de recommendation hoje faz duas invokes na `@luanpoppe/ai` (JSON dos cards, depois texto do chat). Esta mudança junta isso numa única call structured que devolve os dois, sem mudar HTTP, SPA nem cota.

## Decisões macro

- **Decisão**: JSON HTTP permanece `{ movies, response }`. **Por quê**: o SPA e o DTO já batem; unificar a invoke não exige novo contrato. **Alternativa descartada**: renomear campos ou versionar a API.
- **Decisão**: adaptar `AiMovieRecommendationProvider`, `GetMovieRecommendationUseCase`, prompts e schema atuais. **Por quê**: uma feature pequena; segunda implementação só duplica. **Alternativa descartada**: provider novo em paralelo.
- **Decisão**: uma invoke (`callStructuredOutput`); sem wrapper/`AiClient`. **Por quê**: memória do projeto e a lib já é facade. **Alternativa descartada**: fallback para a call de texto se o schema falhar.

## Features (executadas sequencialmente)

1. **unify-recommendation-call** — Schema/prompt da resposta unificada, uma invoke no provider, porta e use case com um método; testes do pipeline.

## Escopo

**Dentro**: backend de recommendation (porta, use case, provider, prompts, schema, testes unitários).

**Fora**: SPA, cota/auth, `GET /movie/queries`, TMDB, live na CI, README salvo se ainda afirmar duas calls (ajuste mínimo só se aparecer).
