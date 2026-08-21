# Recomendações de filmes
> Bounded context legado em `packages/backend/src/domains/movies`. Rotas públicas.

## Áreas
- [Recomendação via IA](recomendacao-ia.md) — `POST /movie/recommendation`: Gemini estruturado + texto conversacional.
- [Histórico de chat no Redis](historico-chat-redis.md) — sessão identificada pelo header `chatid`, TTL de 20 min.
- [Exemplos de queries](exemplos-de-queries.md) — `GET /movie/queries` gera prompts de exemplo para a landing.
