# Spec: Provider de recomendação via @luanpoppe/ai

> Parte de [`migrate-luanpoppe-ai`](../../plan.md)

## Resumo

O adapter de `POST /movie/recommendation` deixa de usar `Langchain` + Gemini direto. Implementa a mesma porta `IMovieRecommendationProvider` com `AI.callStructuredOutput` + `AI.call`, `new AI()` na factory (um por request — `create()` já é por POST). HTTP, use case, Redis de histórico e prompts permanecem.

## Requirements (cenários BDD)

### REQ-1: Filmes estruturados

- **Dado que** o use case chama `getStructuredMoviesRecommendation` com mensagem e `ChatHistoryEntity`
- **Quando** o adapter monta `systemPrompt` (texto atual) + histórico mapeado para `AIMessages` (system/user/ai) + human da mensagem
- **Então** chama `ai.callStructuredOutput` com `aiModel: AiModels.PRIMARY`, `outputSchema: MovieRecommendationSchema`
- **E** se o resultado não passar em `MovieRecommendationSchema.safeParse`, lança `WrongMovieSchemaFromLlmException`
- **E** loga modelo, `durationMs` e sucesso/erro (sem prompt/resposta)

### REQ-2: Texto conversacional

- **Dado que** o use case já tem os filmes
- **Quando** chama `getChatResponse`
- **Então** usa o mesmo `systemPrompt` atual (com `JSON.stringify(movies)`), histórico + user, `ai.call` com `AiModels.PRIMARY`
- **E** devolve `text` da lib
- **E** loga igual ao REQ-1
- **E** some o `console.log` do histórico

### REQ-3: Bootstrap na factory

- **Dado que** `MakeGetMovieRecommendationUseCaseFactory.create()` roda
- **Quando** monta o provider
- **Então** faz **um** `new AI(config)` e injeta no `AiMovieRecommendationProvider`
- **E** `config` tem `openRouterApiKey` só se a chave não for vazia (`exactOptionalPropertyTypes`: omitir, não passar `undefined`)
- **E** `googleGeminiToken` + `aiModelsFallback: [AiModels.GEMINI_FALLBACK]` só se `StringUtils.isEmptyString(env.GEMINI_API_KEY)` for falso
- **E** não usa mais `Langchain` / `BaseChatModel` neste factory

### REQ-4: Contrato externo intacto

- **Dado que** o SPA faz POST `/movie/recommendation`
- **Quando** o fluxo completa
- **Então** body, cota, `chatid` e persistência Redis (ainda `IChatHistoryRepository`) não mudam nesta feature

## Edge cases

- Histórico vazio → só system + user da vez.
- Papel `ai` no tuple → `AIMessages.ai`.
- Schema da lib vs Zod 4.1 do app: se o tipo de `outputSchema` reclamar, assertion **só na borda da chamada**, sem classe wrapper.
- Queries (`GET /movie/queries`) e `lib/langchain` (ainda usados pelos exemplos) **não** saem nesta feature.
- Memória/threadId da lib **não** entra (feature `chat-memory`).
- Unificar `getStructuredMoviesRecommendation` + `getChatResponse` numa chamada só: **fora desta feature** (implica mudar o use case / a porta). Follow-up.

## Contratos

- Porta: `IMovieRecommendationProvider` inalterada.
- Schema: `MovieRecommendationSchema` em `domain/entities/movie-recommendation.entity.ts`.
- Classe nova: `AiMovieRecommendationProvider`; factory deixa de importar `LangchainMovieRecommendationProvider`.
- Mensagens: `AIMessages` da `@luanpoppe/ai`, não `PromptLangchain.parseChatHistory`.
- Dependências: feature `ai-client` (pacote + `AiModels` + env).
