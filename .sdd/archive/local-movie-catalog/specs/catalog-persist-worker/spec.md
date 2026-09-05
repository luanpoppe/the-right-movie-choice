# Spec: Worker de persistência

> Parte de [`local-movie-catalog`](../../plan.md)

## Resumo

Um Worker BullMQ no mesmo processo Fastify consome a fila `catalog-movie-persist` e grava a ficha no `IMovieCatalogRepository.upsert`. Esta feature **não** enfileira (fica em `enqueue-on-tmdb-miss`). O job carrega idioma + `MovieCatalogDetails` já obtido no TMDB.

## Requirements

### REQ-1: Job válido persiste a ficha

- **Dado que** há um job `catalog-movie-persist` com `jobId` `157336:pt-BR`, `language` `pt-BR` e details de Interestelar (`tmdbId` `157336`, `imdbId` `tt0816692`)
- **Quando** o Worker processa o job
- **Então** chama `upsert` com esses details e `pt-BR`
- **E** o job termina como completed
- **E** não chama TMDB

### REQ-2: Conflito de IMDb não entra em retry

- **Dado que** `upsert` lança `MovieCatalogImdbConflictException` (outro filme já tem `tt0816692` em `pt-BR`)
- **Quando** o processor trata o erro
- **Então** registra log de conflito
- **E** não reagenda o job
- **E** o job não fica em failed por causa desse conflito (completed ou equivalente sem retry)

### REQ-3: Falha transitória de Postgres tenta de novo

- **Dado que** `upsert` lança erro de conexão/timeout (não conflito IMDb)
- **Quando** o job falha na 1ª tentativa
- **Então** a fila tenta de novo até 4 corridas no total (1 imediata + 3 esperas)
- **E** os atrasos entre tentativas são 15 s, depois 1 min, depois 5 min
- **E** depois da 4ª falha o job vai para o conjunto `failed` do BullMQ (não some do Redis)
- **E** cada falha é logada (a resposta ao agente já ocorreu em outra feature)

### REQ-4: Mesmo filme não duplica job ativo

- **Dado que** já existe job ativo ou waiting com `jobId` `157336:pt-BR`
- **Quando** um segundo add usa o mesmo `jobId`
- **Então** o segundo não cria outro processor em paralelo para o mesmo par
- **E** o upsert desse filme continua no job que já estava na fila

### REQ-5: Boot liga o Worker sem derrubar o HTTP

- **Entrada** Fastify sobe em `dev` com Redis alcançável
- **Saída** Worker da fila `catalog-movie-persist` fica ouvindo no mesmo processo
- **E** concorrência da fila é `3`
- **Erro** Redis/BullMQ indisponível no boot → log; Fastify continua servindo HTTP; jobs não processam até o Redis voltar (restart ou reconexão, o que o cliente já fizer)

### REQ-6: Payload inválido não retry infinito

- **Entrada** job sem `details.tmdbId` ou sem `language`
- **Saída** log de payload inválido; job não entra no backoff de 15 s / 1 min / 5 min
- **Erro** mesma regra se `details` não for a ficha de catálogo (campos obrigatórios ausentes)

### REQ-7: Failed fica no Redis para retry manual

- **Entrada** job na 4ª falha transitória (Postgres timeout)
- **Saída** o job permanece no set `failed` (BullMQ); `removeOnFail` guarda os últimos `500` failed, não apaga na hora
- **E** um `Job.retry()` (ou equivalente) recoloca o job para processar de novo
- **Erro** conflito IMDb (REQ-2) **não** entra em `failed` — não há retry manual desse caso por essa via

## Edge cases

- Processo único: Worker e HTTP compartilham o event loop; upsert é I/O — request HTTP não espera o job.
- Crash não tratado no processor pode derrubar o processo (HTTP incluso) — processor captura erro conhecido e só relança o transitório para o retry da fila.
- Enqueue ainda não existe nesta feature: testes do Worker usam add direto na fila (ou invocam o processor).

## Contratos expostos

- Fila: `packages/backend/src/domains/movies/domain/movie-catalog-persist.constants.ts` (`QUEUE_NAME`, `jobId`).
- Payload: `packages/backend/src/domains/movies/domain/entities/movie-catalog-persist-job.entity.ts` (`MovieCatalogPersistJobData`).
- Persistência: `packages/backend/src/domains/movies/domain/repositories/movie-catalog.repository.ts` (`upsert`).
- Conflito: `packages/backend/src/domains/movies/domain/exceptions/movie-catalog-imdb-conflict.exception.ts`.
- Failed (DLQ nativa): `REMOVE_ON_FAIL_COUNT` nas mesmas constantes; set `failed` do BullMQ; retry `Job.retry()`.
