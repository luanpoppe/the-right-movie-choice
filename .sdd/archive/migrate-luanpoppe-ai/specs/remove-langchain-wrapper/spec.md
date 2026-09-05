# Spec: Remover wrapper LangChain

> Parte de [`migrate-luanpoppe-ai`](../../plan.md)

## Resumo

Some o runtime Gemini/LangChain local (`src/lib/langchain` e adapters leftover). Ficam só `@luanpoppe/ai` e o peer do checkpointer Redis. README deixa de citar o wrapper e o repositório JSON de chat.

## Requirements (cenários BDD)

### REQ-1: Pasta `lib/langchain` e adapters leftover

- **Dado que** recommendation e query examples já usam `Ai*Provider`
- **Quando** esta feature entra
- **Então** apaga `packages/backend/src/lib/langchain/` inteiro
- **E** apaga `langchain-movie-recommendation.provider.ts` + spec irmã e `langchain-movies-query-examples.provider.ts` + spec irmã (órfãos no disco)
- **E** o `pnpm test` do backend continua verde sem esses arquivos

### REQ-2: Dependências no `package.json`

- **Dado que** a memória de chat usa `RedisSaver.fromUrl`
- **Quando** limpa as deps LangChain
- **Então** remove `@langchain/core`, `@langchain/google-genai` e `langchain`
- **E** **mantém** `@langchain/langgraph-checkpoint-redis`
- **E** `pnpm-lock.yaml` reflete o remove (transitives do checkpointer podem permanecer)

### REQ-3: Utils de histórico morto

- **Dado que** o provider novo e o adapter de memória não usam `ChatHistoryAiMessagesUtils`
- **Quando** limpa leftovers
- **Então** apaga `chat-history-ai-messages.utils.ts` e o spec em `providers/specs/`

### REQ-4: README

- **Dado que** o README descreve a arquitetura do backend
- **Quando** a limpeza fecha
- **Então** tira `lib/langchain` da lista de `lib/`
- **E** troca `ChatHistoryRedisRepository` por algo atual (`ChatHistoryAiMemoryRepository` / checkpointer)
- **E** a linha de “IA generativa (Google Gemini)” no topo passa a refletir OpenRouter + Gemini opcional (sem reescrever o README inteiro)

## Edge cases

- Specs de factory que afirmam “não referencia Langchain” continuam válidos depois do delete.
- Peer `@langchain/core` 1.x vs 0.3: ao remover o 0.3 direto, o lock pode puxar o core que o checkpointer 1.0.11 pede — não forçar pin antigo.
- Não apagar `lib/redis`, `lib/ai`, prompts de movies, HTTP, SPA.
- Não remover o checkpointer só para “zerar LangChain no package.json”.

## Contratos

- Sem mudança de porta HTTP, use case ou `IMovieRecommendationProvider`.
- `package.json` do backend: única dep LangChain direta restante = `@langchain/langgraph-checkpoint-redis`.
