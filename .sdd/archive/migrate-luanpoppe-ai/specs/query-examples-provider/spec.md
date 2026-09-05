# Spec: Provider de exemplos de query via @luanpoppe/ai

> Parte de [`migrate-luanpoppe-ai`](../../plan.md)

## Resumo

O adapter de `GET /movie/queries` deixa LangChain/Gemini FLASH_LITE. Implementa a mesma porta `IMovieQueryExampleProvider` com um `AI.callStructuredOutput`, `new AI()` na factory (espelhando recommendation: `buildAiConfig` **privado duplicado**, não extraído). HTTP, use case, schema e texto do prompt permanecem.

## Requirements (cenários BDD)

### REQ-1: Três queries estruturadas

- **Dado que** o use case chama `getQueryExamples`
- **Quando** o adapter usa o prompt atual (arquivo próprio, classe estática) como `AIMessages.human` (igual ao `prompt.create({ userMessage })` de hoje — não vira system)
- **Então** chama `ai.callStructuredOutput` com `aiModel: AiModels.PRIMARY`, `modelConfig: { temperature: QUERY_EXAMPLES_TEMPERATURE }` (constante `1.5`, não env), `outputSchema: MovieQueryExamplesSchema`
- **E** `safeParse` em `result.response`; falha → `WrongMovieSchemaFromLlmException` (a mesma de hoje)
- **E** loga modelo, `durationMs`, sucesso/erro, sem body

### REQ-2: Factory

- **Dado que** `MakeGetMoviesQueryExamplesUseCaseFactory.create()` roda
- **Quando** monta o provider
- **Então** um `new AI(config)` via `buildAiConfig` privado (mesma regra de chaves da factory de recommendation; **não** extrair util compartilhado nesta feature)
- **E** injeta em `AiMoviesQueryExamplesProvider`
- **E** some `Langchain`, `GEMINI_MODELS.FLASH_LITE_2_5` e `cache: false` desta factory

### REQ-3: Contrato HTTP

- **Dado que** o SPA faz GET `/movie/queries`
- **Quando** o fluxo completa
- **Então** body/DTO e rota pública não mudam

## Edge cases

- `cache: false` do Gemini **não** tem equivalente nesta chamada OpenRouter — não recriar.
- Assertion de Zod só na borda se o TS exigir.
- Recommendation, `lib/langchain` e chat-memory **não** saem nesta feature; apagar só o provider LangChain de query examples e o spec irmão.
- Sem histórico, `threadId` ou `AIMessages` de chat.

## Contratos

- Porta: `IMovieQueryExampleProvider` inalterada.
- Schema: `MovieQueryExamplesSchema` em `domain/entities/movie-query-examples.entity.ts`.
- Prompt: `MovieQueryExamplesPrompts` (arquivo ao lado do provider).
- Constante de temperature nomeada no módulo de prompt ou no provider — não env var.
- Classe: `AiMoviesQueryExamplesProvider`.
- Dependências: `ai-client` + padrão da factory de recommendation.
