# Spec: Enqueue no miss

> Parte de [`local-movie-catalog`](../../plan.md)

## Resumo

Quando `MovieCatalogDetailsResolver` obtém details novos do TMDB (miss no Postgres ou refresh de ficha velha com sucesso), enfileira job `catalog-movie-persist` sem bloquear a resposta ao agente ou ao GET debug. Falha no enqueue só loga — a ficha já foi devolvida e o Redis já foi atualizado.

## Requirements

### REQ-1: Miss TMDB enfileira persistência

- **Dado que** o resolver busca Interestelar (`tmdbId` `157336`, `pt-BR`) no TMDB porque não há linha fresca no Postgres e o Redis está vazio
- **Quando** `resolveByTmdbId` devolve a ficha ao caller (agente ou debug)
- **Então** responde imediatamente com `MovieCatalogDetails` de Interestelar
- **E** grava Redis na chave de details (`157336`, `pt-BR`) como hoje
- **E** adiciona job na fila `catalog-movie-persist` com `jobId` `157336:pt-BR` e payload `{ language: pt-BR, details }`
- **E** o job herda `defaultJobOptions()` da factory do Worker (4 tentativas, backoff custom)

### REQ-2: Falha no enqueue não atrapalha a resposta

- **Dado que** o TMDB devolveu details de Duna (`tmdbId` `438631`, `pt-BR`)
- **Quando** `Queue.add` lança (Redis indisponível no enqueue)
- **Então** o caller ainda recebe os details de Duna
- **E** registra log de aviso com `tmdbId`, `language` e motivo
- **E** não relança o erro para o agente nem para o GET debug

### REQ-3: Refresh de ficha velha também enfileira

- **Entrada** linha `157336:pt-BR` com `updatedAt` há 31 dias; TMDB responde com details atualizados
- **Saída** devolve details do TMDB; atualiza Redis; enfileira job com os details novos
- **Erro** TMDB falha no refresh → devolve ficha velha (comportamento atual); **não** enfileira

### REQ-4: Hit local fresco ou Redis não enfileira

- **Entrada** Redis hit com details de `157336:pt-BR`; ou Postgres fresco (`updatedAt` há menos de 30 dias)
- **Saída** devolve details sem chamar TMDB
- **E** não chama `Queue.add`

### REQ-5: Debug GET details no mesmo enqueue

- **Dado que** o cliente chama `GET /debug/tmdb/movies/157336?language=pt-BR` com miss TMDB (sem Postgres/Redis)
- **Quando** o controller retorna HTTP 200 com a ficha
- **Então** o enqueue do REQ-1 ocorreu via `MovieCatalogDetailsResolver` (mesmo caminho do agente)

### REQ-6: jobId deduplica na fila

- **Entrada** job `157336:pt-BR` já está `waiting` ou `active` na fila
- **Saída** segundo `add` com o mesmo `jobId` não cria outro processor em paralelo para o mesmo par (semântica BullMQ de `jobId` fixo)
- **Erro** re-add com mesmo `jobId` não propaga erro ao caller

### REQ-7: Porta de enqueue isolada

- **Entrada** `enqueue({ language: "pt-BR", details })` com `tmdbId` `157336` válido
- **Saída** job na fila `catalog-movie-persist` com payload tipado `MovieCatalogPersistJobData`
- **Erro** `details` sem `tmdbId` ou `language` vazio → log; retorna sem throw (não quebra o resolver)

## Edge cases

- Enqueue não espera o Worker nem o upsert Postgres — só o `add` ao Redis/BullMQ (operação rápida); falha do `add` é capturada e logada.
- Lookup por título que cai no search TMDB enfileira no mesmo ponto: quando `resolveByTmdbId` busca details no TMDB após o 1º hit da search.
- Search TMDB sozinho (lista de hits) **não** enfileira — só quando a ficha completa `MovieCatalogDetails` existe.
- Worker offline no boot (F3) não impede enqueue: jobs ficam waiting até o Worker subir.

## Contratos expostos

- Fila e `jobId`: `packages/backend/src/domains/movies/domain/movie-catalog-persist.constants.ts` (`QUEUE_NAME`, `jobId`).
- Payload: `packages/backend/src/domains/movies/domain/entities/movie-catalog-persist-job.entity.ts` (`MovieCatalogPersistJobData`).
- Opções do job: `packages/backend/src/domains/movies/infrastructure/factories/make-catalog-persist-worker.factory.ts` (`defaultJobOptions`).
- Ponto de integração: `packages/backend/src/domains/movies/infrastructure/providers/movie-catalog-details.resolver.ts` (`resolveByTmdbId` — após fetch TMDB com sucesso).
- Enqueue: `packages/backend/src/domains/movies/infrastructure/workers/catalog-persist.enqueuer.ts` (`CatalogPersistEnqueuer.enqueue`).
