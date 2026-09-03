# Recomendações de filmes
> Bounded context legado em `packages/backend/src/domains/movies`. POST de recommendation com cota anônima; queries públicas.

## Áreas
- [Cliente @luanpoppe/ai](cliente-luanpoppe-ai.md) — pacote + `AiModels`; adapters farão `new AI()` (ainda não ligados).
- [Recomendação via IA](recomendacao-ia.md) — `POST /movie/recommendation`: Gemini estruturado + texto conversacional.
- [Cota anônima e Bearer](cota-anonima-e-bearer.md) — 2 POSTs por `guest-id`; JWT ilimitado; `GET /movie/queries` sem cota.
- [Histórico de chat no Redis](historico-chat-redis.md) — sessão identificada pelo header `chatid`, TTL de 20 min.
- [Exemplos de queries](exemplos-de-queries.md) — `GET /movie/queries` gera prompts de exemplo para a landing.
