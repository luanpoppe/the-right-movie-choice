# Spec: Pacote @luanpoppe/ai

> Parte de [`migrate-luanpoppe-ai`](../../plan.md)

## Resumo

Instala `@luanpoppe/ai` (^1.1.6) no backend, valida env (OpenRouter obrigatório fora de test, Gemini opcional) e expõe constantes de modelo em `lib/ai`. **Não** há wrapper nem singleton: cada adapter/factory faz `new AI()` na hora da chamada. Esta feature não liga providers de filme nem memória.

## Requirements (cenários BDD)

### REQ-1: Pacote e constantes de modelo

- **Dado que** o backend declara `@luanpoppe/ai` com range `^`
- **Quando** o código precisa do slug primário ou de fallback
- **Então** usa `AiModels.PRIMARY` = `openrouter/deepseek/deepseek-v4-flash` e `AiModels.GEMINI_FALLBACK` = `gemini-2.5-flash` (não env)

### REQ-2: Instância no call site (contrato para as próximas features)

- **Dado que** um adapter vai falar com LLM
- **Quando** ele dispara uma chamada
- **Então** instancia `new AI({...})` **ali** (não reutiliza singleton de módulo)
- **E** passa `openRouterApiKey` a partir de `env.OPENROUTER_API_KEY`
- **E** só passa `googleGeminiToken` + `aiModelsFallback: [AiModels.GEMINI_FALLBACK]` se `StringUtils.isEmptyString(env.GEMINI_API_KEY)` for falso
- **E** chama `AI.call` / `AI.callStructuredOutput` da lib, com `aiModel` default = `AiModels.PRIMARY`

### REQ-3: Falha de boot sem OpenRouter

- **Dado que** `NODE_ENV` é `dev` ou `prod` e `OPENROUTER_API_KEY` está vazia
- **Quando** `env.ts` faz parse
- **Então** o processo não sobe (mesmo padrão do TMDB)
- **Dado que** `NODE_ENV` é `test`
- **Quando** a chave OpenRouter falta
- **Então** o parse do env não falha por isso

## Edge cases

- Gemini `""` → sem token/fallback no `new AI()` (espaços: `isEmptyString` atual não faz trim).
- Sem `memory`/`threadId` nesta feature (`chat-memory`).
- Não altera providers LangChain.
- Logs de modelo/latência ficam no adapter (próximas features), não num wrapper.

## Contratos

- Env: `OPENROUTER_API_KEY` (obrigatória fora de test); `GEMINI_API_KEY` opcional → `googleGeminiToken`.
- Superfície pública desta feature: pacote + `AiModels` + `env`. Superfície de chamada = a da lib 1.1.x.
- Dependências: nenhuma. Recommendation e queries consomem `new AI()` + `AiModels`.
