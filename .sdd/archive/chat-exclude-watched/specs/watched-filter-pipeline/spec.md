# Spec: Pipeline backend de exclusão de assistidos

> Parte de [`chat-exclude-watched`](../../plan.md)

## Resumo

Quando `excludeWatched=true` num POST autenticado de recommendation, o backend amplia o pool de candidatos (25), filtra assistidos após o lookup no catálogo e repete até obter pelo menos 2 filmes finais com `tmdbId` verificado como não-assistido — ou esgota 5 rodadas.

## Requirements

### REQ-1: Recommendation sem filmes já assistidos

- **Dado que** um usuário autenticado envia `POST /movie/recommendation` com `excludeWatched: true`
- **Quando** a recommendation é concluída com sucesso
- **Então** cada filme retornado com `tmdbId` presente não está marcado como `watched` para esse usuário
- **E** há pelo menos 2 filmes com `tmdbId` verificado como não-assistido, quando o catálogo e o histórico permitirem

### REQ-2: Modo sem filtro preserva comportamento atual

- **Dado que** um usuário autenticado envia `POST /movie/recommendation` com `excludeWatched: false`
- **Quando** a recommendation é concluída
- **Então** o fluxo segue o prompt e limites atuais (4–8 candidatos, uma chamada `lookupMovies`, sem filtro de assistidos)

### REQ-3: Anônimo ignora a flag

- **Dado que** um visitante anônimo envia `POST /movie/recommendation` com `excludeWatched: true`
- **Quando** a recommendation é concluída
- **Então** o fluxo é idêntico ao anônimo atual, sem consultar `UserMovieEntry`

### REQ-4: Esgotamento das rodadas

- **Dado que** um usuário autenticado com `excludeWatched: true` esgota 5 rodadas sem atingir 2 filmes finais verificados como não-assistidos
- **Quando** a recommendation é concluída
- **Então** retorna o melhor esforço disponível (0, 1 ou mais filmes válidos após sanitização)
- **E** o campo `response` avisa brevemente que quase tudo do histórico já foi assistido

### REQ-5: Default da flag para autenticado

- **Entrada** `POST /movie/recommendation` autenticado sem campo `excludeWatched` no body
- **Saída** o fluxo trata como `excludeWatched: true`

### REQ-6: Filtro na tool `lookupMovies`

- **Entrada** tool `lookupMovies` com `userId` e `excludeWatched: true`, batch de até 25 queries
- **Saída** array na mesma ordem das queries, omitindo hits cujo `details.tmdbId` está `watched=true` para o usuário
- **E** entradas com `found: false` permanecem no array

### REQ-7: Loop no provider

- **Entrada** `excludeWatched: true`, `userId` e mensagem do usuário
- **Saída** até 5 `callStructuredOutput` completas
- **E** nova rodada quando, após sanitização, há menos de 2 filmes finais com `tmdbId` verificado como não-assistido
- **E** rodadas seguintes recebem contexto com títulos/`tmdbId` já tentados ou assistidos para evitar repetição

### REQ-8: Sanitização da resposta final

- **Entrada** JSON do LLM com filme cujo `tmdbId` está `watched=true` para o usuário
- **Saída** esse filme é removido da lista `movies` antes da resposta HTTP
- **E** a remoção conta para o critério de retry do REQ-7

### REQ-9: Consulta batch de assistidos

- **Entrada** `userId: 42` e `tmdbIds: [550, 680, 13]`
- **Saída** subconjunto dos ids com `watched=true` em `UserMovieEntry` (ex.: `[550, 13]`)
- **Erro** lista vazia de ids → `[]`  ||  não lança

### REQ-10: Constantes do pipeline

- **Entrada** modo `excludeWatched: true`
- **Saída** usa constantes nomeadas: `CANDIDATE_POOL_SIZE = 25`, `MIN_VERIFIED_UNWATCHED = 2`, `MAX_EXCLUDE_ROUNDS = 5`
- **E** modo `excludeWatched: false` mantém `MAX_QUERIES = 8` na tool

## Edge cases

- Histórico de assistidos vazio: nenhum hit é filtrado pelo REQ-6
- Catálogo/TMDB indisponível numa rodada: misses estruturados seguem o comportamento atual da tool  ||  não aborta o turno inteiro
- Todas as 25 queries da rodada são assistidas: provider inicia próxima rodada com contexto de exclusão até o teto de 5
- `excludeWatched: true` com JWT inválido: rejeição de auth existente, antes do pipeline

## Contratos expostos

- Body de `POST /movie/recommendation` ganha campo opcional `excludeWatched: boolean` (default efetivo `true` para autenticado quando ausente; ignorado para anônimo). Schema em `packages/backend/src/domains/movies/infrastructure/http/dto/movie-recommendation.dto.ts` (a criar/estender nesta feature).
- Porta `IUserMovieEntryRepository` ganha método batch de ids assistidos (assinatura definida no chunk de domínio/repositório).
