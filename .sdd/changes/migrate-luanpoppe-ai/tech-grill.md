# Tech grill — migrar runtime de IA para @luanpoppe/ai
<!-- 2026-09-03 · branch feature/migrate-luanpoppe-ai -->

## Escopo grelhado
Eixos cobertos: boundaries & ownership, state/memória, failure modes/fallback, testing, migration (chaves Redis), observability, secrets/env. | Eixos descartados: data model de filme e contrato HTTP (reúso das portas/Zod); AuthZ extra (mesma rota); performance/escala (volume baixo); concorrência (um chatId por sessão).

## Decisões
### Boundaries — `new AI()` no call site
- **Escolha:** Adapters importam `@luanpoppe/ai` e instanciam `new AI()` em cada uso. `lib/ai` só tem slugs (`AiModels`).
- **Alternativas descartadas:** singleton/`AiClient` wrapper (rejeitado na revisão); serviço de domínio novo.
- **Porquê:** a lib já é a facade; wrapper só duplicava tipos e gerava atrito com Zod/`exactOptionalPropertyTypes`.
- **Custo aceito:** config OpenRouter/Gemini repetida nos dois adapters (regra dos 3 strikes: extrair só se aparecer 3ª vez).

### Estado — IChatHistoryRepository adapta a memória da lib
- **Escolha:** Manter a porta; implementação usa checkpointer da lib no Redis existente; `chatId` + TTL 20 min.
- **Alternativas descartadas:** lib dona do thread (muda o use case); dual-write; Postgres; SQLite.
- **Porquê:** chat continua efêmero; Redis de refresh token permanece outro uso do mesmo serviço.
- **Custo aceito:** formato interno das chaves muda; sessões ativas no deploy perdem contexto até o TTL.

### Falha — OpenRouter primário, Gemini fallback nativo e opcional
- **Escolha:** Cadeia da lib; `OPENROUTER_API_KEY` obrigatória; `GEMINI_API_KEY` opcional (sem chave = sem fallback).
- **Alternativas descartadas:** Gemini primário; try/catch no provider; duas chaves sempre obrigatórias.
- **Porquê:** você inverteu a cadeia e não quer Gemini mandatório em todo ambiente.
- **Custo aceito:** ambiente só com OpenRouter não tem backup se o vendor cair.

### Testes — mock de `AI` no adapter; live opt-in
- **Escolha:** Unitário mocka a classe `AI` da lib no adapter; live fora da CI.
- **Alternativas descartadas:** live na CI; wrapper testável no meio.
- **Porquê:** CI sem cota/flaky de LLM.
- **Custo aceito:** regressão de contrato da lib só aparece no live local ou em prod.

### Migração — chaves antigas expiram
- **Escolha:** Não converter `ChatHistoryEntity` no Redis antigo.
- **Alternativas descartadas:** migrar; flush no deploy.
- **Porquê:** TTL 20 min; formato incompatível com o checkpointer.
- **Custo aceito:** conversas no ar no momento do deploy “esquecem” o turno anterior.

### Observabilidade — provedor, latência, schema
- **Escolha:** Logar qual provedor atendeu, latência e falha de Zod/schema. Não logar prompt/resposta completos.
- **Alternativas descartadas:** logs mínimos só de erro; dump de prompt.
- **Porquê:** debug de fallback às 3h sem vazar texto do usuário.
- **Custo aceito:** sem replay fiel da conversa pelos logs.

## Riscos abertos / a revisitar
- Fallback Gemini inútil em ambientes sem `GEMINI_API_KEY` — gatilho: OpenRouter instável em prod.
- Checkpointer LangGraph no mesmo Redis do refresh token — gatilho: colisão de prefixo de chave (tratar na spec de `chat-memory`).
- `@luanpoppe/ai` ainda puxa LangChain por baixo; “remover deps diretas” pode deixar transitivas — gatilho: `pnpm why` na feature `remove-langchain-wrapper`.

## Perguntas não resolvidas
- Nomes exatos de modelo OpenRouter/Gemini e API pública da lib (factory, structured output, checkpointer Redis) — grill fino na spec de `ai-client` / `chat-memory` quando o `lp:continue` ler o pacote instalado.
