# Spec: Leitura do pool na API

> Parte de [`query-suggestions-pool`](../../plan.md)

## Resumo

`GET /movie/queries` passa a servir 3 sugestões aleatórias do pool Postgres quando há pelo menos 3 itens persistidos. Com menos de 3 (incluindo zero) ou falha de leitura no banco, cai no comportamento atual via IA — contrato HTTP e frontend permanecem iguais.

## Requirements

### REQ-1: Leitura aleatória com pool suficiente

- **Dado que** o pool tem 47 sugestões persistidas
- **Quando** um visitante abre a landing e o frontend chama `GET /movie/queries`
- **Então** a resposta HTTP 200 traz exatamente 3 itens em `queries`
- **E** cada `queryExample` vem da coluna `text` do banco (casing original)
- **E** os 3 textos são distintos entre si
- **E** nenhuma chamada à IA é feita nesse caminho

### REQ-2: Pool vazio usa IA

- **Dado que** o pool tem 0 sugestões (ambiente novo, seed ainda não rodou)
- **Quando** o frontend chama `GET /movie/queries`
- **Então** o backend gera 3 exemplos via IA com o mesmo provider/prompt/schema de hoje
- **E** a resposta HTTP 200 mantém `queries.length === 3`
- **E** registra log informando fallback por pool insuficiente

### REQ-3: Pool parcial ignora o banco e usa IA

- **Dado que** o pool tem 1 ou 2 sugestões (seed incompleto)
- **Quando** o frontend chama `GET /movie/queries`
- **Então** o backend ignora os itens parciais do pool
- **E** gera 3 exemplos via IA (mesmo fluxo do REQ-2)
- **E** a resposta HTTP 200 mantém `queries.length === 3`

### REQ-4: Seleção sem repetição no pool

- **Entrada** pool com textos `["A", "B", "C", "D", "E"]`; pedido de 3 sugestões
- **Saída** array de 3 strings, cada uma pertencente ao conjunto de entrada
- **E** nenhum texto aparece mais de uma vez na mesma resposta

### REQ-5: Contrato HTTP inalterado

- **Entrada** resposta bem-sucedida de `GET /movie/queries`
- **Saída** body `{ queries: [{ queryExample: string }, ...] }` com exatamente 3 elementos
- **E** formato validado pelo schema Zod já usado no controller e no SPA

### REQ-6: Falha de Postgres tenta IA

- **Entrada** `count()` ou leitura aleatória do pool lança erro de conexão/timeout Postgres
- **Saída** o backend tenta o provider IA como plano B
- **E** se a IA responder com schema válido, retorna HTTP 200 com 3 itens
- **Erro** se a IA também falhar → HTTP 500 com o mesmo envelope de erro de hoje

## Edge cases

- Duas requisições simultâneas com pool ≥ 3: cada uma pode sortear conjuntos diferentes  ||  sem lock de leitura
- Pool com exatamente 3 itens: devolve os 3 (ordem aleatória), sem IA
- IA no fallback retorna schema inválido: HTTP 500 (`WrongMovieSchemaFromLlmException` ou erro genérico), como hoje

## Contratos expostos

- `GET /movie/queries` — body validado por `packages/backend/src/domains/movies/infrastructure/http/dto/movies-query-examples.dto.ts:MoviesQueryExamplesResponseDTOSchema`
- OpenAPI: `packages/backend/src/domains/movies/infrastructure/http/docs/movies-query-examples.docs.ts:MoviesQueryExamplesDocs`
