# Pacote @luanpoppe/ai
> Atualizado em 2026-09-03 · fontes: `packages/backend/src/lib/ai/ai-models.ts`, `env.ts`

## O que é
Dependência `@luanpoppe/ai` no backend + slugs de modelo. Não há classe wrapper: cada adapter faz `new AI()`.

## Como funciona
- Env: `OPENROUTER_API_KEY` obrigatória fora de `test`; `GEMINI_API_KEY` opcional (`""` default).
- `AiModels.PRIMARY` / `GEMINI_FALLBACK` para `aiModel` e lista de fallback.
- Providers de filme ainda usam LangChain até as próximas features.

## Decisões e porquês
- Sem singleton — a lib já é facade; wrapper gerou atrito de tipos.
- Gemini `default("")` — LangChain legado ainda tipa a chave como string.

## Notas
Logs de chamada ficam no adapter. `isEmptyString` não faz trim em Gemini.
