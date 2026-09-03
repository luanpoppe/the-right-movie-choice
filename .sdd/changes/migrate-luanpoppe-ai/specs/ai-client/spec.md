# Spec: Cliente @luanpoppe/ai

> Parte de [`migrate-luanpoppe-ai`](../../plan.md)

## Resumo

Instala `@luanpoppe/ai` (^1.1.6) no backend e um cliente fino singleton em `lib/ai` que configura OpenRouter (obrigatório fora de test) e Gemini opcional como `aiModelsFallback`. Expõe `call` e `callStructuredOutput` com log de modelo, latência e erro. Não liga providers de filme nem memória.

## Requirements (cenários BDD)

### REQ-1: Bootstrap com OpenRouter

- **Dado que** `NODE_ENV` não é `test` e `OPENROUTER_API_KEY` está preenchida
- **Quando** o processo carrega `env.ts` e o singleton do cliente
- **Então** `new AI({ openRouterApiKey })` usa modelo primário `openrouter/deepseek/deepseek-v4-flash` (constante, não env)

### REQ-2: Fallback Gemini só com chave

- **Dado que** `GEMINI_API_KEY` não está vazia (`StringUtils.isEmptyString`)
- **Quando** o singleton é criado
- **Então** passa `googleGeminiToken` e `aiModelsFallback: ["gemini-2.5-flash"]`
- **Dado que** a chave Gemini está ausente ou vazia
- **Quando** o singleton é criado
- **Então** não passa token Gemini nem lista de fallback

### REQ-3: Falha de boot sem OpenRouter

- **Dado que** `NODE_ENV` é `dev` ou `prod` e `OPENROUTER_API_KEY` está vazia
- **Quando** `env.ts` faz parse
- **Então** o processo não sobe (mesmo padrão do `TMDB_ACCESS_TOKEN`: `superRefine` + `StringUtils.isEmptyString`)
- **Dado que** `NODE_ENV` é `test`
- **Quando** a chave OpenRouter falta
- **Então** o parse do env não falha por isso

### REQ-4: Wrapper de call e structured output

- **Dado que** o singleton existe
- **Quando** alguém chama `call` ou `callStructuredOutput` no cliente
- **Então** delega para `AI.call` / `AI.callStructuredOutput` da lib, com o modelo primário default se o caller não passar `aiModel`
- **E** o logger registra modelo pedido, duração e erro (sem prompt/resposta completos)
- **E** o fallback nativo da lib (retry + próxima entrada de `aiModelsFallback`) permanece interno à lib

## Edge cases

- String Gemini `""` / só espaço → trata como ausente; sem fallback.
- `GEMINI_API_KEY` deixa de ser `z.string()` obrigatório; `.env.example` documenta as duas chaves.
- Esta feature **não** passa `memory`/`checkpointer`/`threadId` (feature `chat-memory`).
- Esta feature **não** altera `LangchainMovieRecommendationProvider` nem factories de movies.
- Pacote: `pnpm add @luanpoppe/ai` no workspace `packages/backend` com range `^`.
- Teste unitário do cliente mocka `AI` (não chama rede). Live opt-in fica para depois, se houver — fora desta spec.

## Contratos

- Env: `OPENROUTER_API_KEY` (obrigatória fora de test); `GEMINI_API_KEY` opcional — continua esse nome, mapeada para `googleGeminiToken`.
- Constantes de modelo no cliente (não env): primário `openrouter/deepseek/deepseek-v4-flash`; fallback `gemini-2.5-flash`.
- Superfície: métodos `call` e `callStructuredOutput` alinhados à lib 1.1.x (`messages`, `systemPrompt`, `outputSchema`, override opcional de `aiModel` / `aiModelsFallback`).
- Instância: um `AI` por processo (módulo), como Redis/Prisma.
- Logs: logger existente em `lib/logger` — campos úteis: modelo, `durationMs`, `ok`/`error` (mensagem, não body do LLM).
- Dependências: nenhuma feature anterior. As features de recommendation, queries e memória consomem este cliente.
