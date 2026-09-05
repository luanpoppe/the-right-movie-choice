# Pacote @luanpoppe/ai
> Atualizado em 2026-09-04 · fontes: `packages/backend/src/lib/ai/ai-models.ts`, `env.ts`, `packages/backend/package.json`

## O que é
Dependência `@luanpoppe/ai` no backend + slugs de modelo. Não há classe wrapper: cada adapter faz `new AI()`. Pasta `src/lib/langchain` e deps LangChain 0.3 diretas foram removidas.

## Como funciona
- Env: `OPENROUTER_API_KEY` obrigatória fora de `test`; `GEMINI_API_KEY` opcional (`""` default).
- `AiModels.PRIMARY` / `GEMINI_FALLBACK` para `aiModel` e lista de fallback.
- Providers de filme: recommendation e query examples fazem `new AI()` nas respectivas factories. Só recommendation passa `memory` Redis.

## Decisões e porquês
- Sem singleton — a lib já é facade; wrapper gerou atrito de tipos.
- Única dep LangChain direta restante: `@langchain/langgraph-checkpoint-redis` (memória). Core/google-genai/`langchain` saíram do `package.json`.
- Gemini `default("")` — chave opcional; string vazia = sem fallback.

## Notas
Logs de chamada ficam no adapter. `isEmptyString` não faz trim em Gemini. Transitives do `@luanpoppe/ai` podem ainda listar `langchain` 1.x no lock.
