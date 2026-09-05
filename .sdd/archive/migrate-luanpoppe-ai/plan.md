# Migrar runtime de IA para @luanpoppe/ai

> **id**: `migrate-luanpoppe-ai` · **criada**: 2026-09-03 · **idioma**: pt-BR

## Contexto

O backend recomenda filmes e gera exemplos de query via wrapper local `src/lib/langchain` (Gemini + LangChain). Esta mudança troca esse runtime pela biblioteca pública `@luanpoppe/ai`, com OpenRouter como provedor primário, fallback nativo para Gemini quando a chave existir, e histórico de chat na memória da lib (checkpointer no Redis já usado), sem mudar HTTP, SPA nem cota/auth.

## Decisões macro

- **Decisão**: Adapters de movies (portas atuais) fazem `new AI()` da `@luanpoppe/ai` no call site; `lib/ai` só guarda constantes de modelo. **Por quê**: a lib já é a facade. **Alternativa descartada**: singleton/`AiClient` wrapper.
- **Decisão**: `IChatHistoryRepository` vira adapter da memória da lib; `chatId` e TTL de 20 min permanecem. **Por quê**: o use case já orquestra load/save. **Alternativa descartada**: lib dona do thread (quebra as portas) e dual-write.
- **Decisão**: OpenRouter primário (fallback nativo → Gemini). `OPENROUTER_API_KEY` obrigatória; `GEMINI_API_KEY` opcional — sem ela, sem fallback. **Por quê**: você inverteu a cadeia e não quer Gemini mandatório. **Alternativa descartada**: as duas chaves sempre obrigatórias.
- **Decisão**: Checkpointer no Redis existente; chaves antigas de chat expiram no TTL; logs de provedor usado, latência e falha de schema (sem prompt completo). **Por quê**: chat é efêmero; Redis de refresh token não se mistura por acidente de produto, só de infra. **Alternativa descartada**: Postgres, SQLite, migrar histórico antigo, logar prompt.
- **Decisão**: Testes unitários mockam `AI` no adapter; live opt-in local, fora da CI. **Por quê**: memória de testes TMDB. **Alternativa descartada**: live na CI.

## Features (executadas sequencialmente)

1. **ai-client** — Instalar `@luanpoppe/ai`, env OpenRouter/Gemini e constantes de modelo (`AiModels`); sem wrapper.
2. **recommendation-provider** — Recommendation (JSON estruturado + texto) via `new AI()`, mantendo `IMovieRecommendationProvider`.
3. **query-examples-provider** — `GET /movie/queries` via `new AI()`.
4. **chat-memory** — Adapter de `IChatHistoryRepository` na memória da lib (Redis + TTL 20 min + `chatId`).
5. **remove-langchain-wrapper** — Remover `src/lib/langchain` e dependências LangChain diretas do `package.json`.

## Escopo

**Dentro**: pacote `@luanpoppe/ai` no backend; constantes de modelo; dois providers com `new AI()` cada; memória de chat via lib; env OpenRouter; fallback Gemini se houver chave; logs nos adapters; limpeza do wrapper LangChain.

**Fora**: SPA, cota anônima/Bearer, Redis de refresh token, áudio/embeddings, agentes novos, mudança de contrato HTTP, live na CI. Unificar as duas chamadas LLM da recommendation (estruturado + texto) numa só — follow-up; mexe no use case/porta e não entra nesta mudança.
