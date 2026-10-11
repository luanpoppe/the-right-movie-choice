# Spec: API de busca no TMDB

> Parte de [`movie-catalog-search`](../../plan.md)

## Resumo

Cliente HTTP (página ou tool, nas features seguintes) busca filme no TMDB por nome ou por discover. Pessoa e palavra-chave têm busca de candidatos para quem chama escolher o id. A resposta de filme não espera a fila.

## Requirements

### REQ-1: Busca por nome

- **Dado que** o TMDB responde `/search/movie` para "Interstellar" em 2014
- **Quando** o cliente chama a busca por texto com `query=Interstellar`, `year=2014`, `page=1` e sem idioma
- **Então** o backend chama o TMDB com `include_adult=false` e idioma `en-US`
- **E** responde 200 com a página 1 e os hits (id, título, ano, poster, sinopse)
- **E** enfileira cada hit da página em `catalog-movie-persist` para `en-US`
- **E** devolve o 200 sem esperar o worker

### REQ-2: Nome vazio vira populares

- **Dado que** o discover sem filtro devolve a página popular em `pt-BR`
- **Quando** o cliente chama a busca por texto com `query` vazio ou só espaços e `language=pt-BR`
- **Então** responde 200 com essa página popular
- **E** não chama `/search/movie`

### REQ-3: Discover com filtros

- **Dado que** o TMDB responde `/discover/movie`
- **Quando** o cliente pede gêneros 28 e 35, nota mínima 7, anos 2010 a 2015, página 2 e `language=pt-BR`
- **Então** o backend pede ao TMDB gênero em "ou" (`28|35`), `vote_average.gte=7`, lançamento de 2010 a 2015 e `sort_by=popularity.desc`
- **E** manda `include_adult=false`
- **E** responde 200 com a página 2 no idioma `pt-BR`
- **E** enfileira cada hit dessa página

### REQ-4: Discover sem filtro

- **Dado que** nenhum filtro de discover foi enviado
- **Quando** o cliente chama o discover com `page=1` e sem idioma
- **Então** responde 200 com a primeira página popular em `en-US`
- **E** a ordenação continua `popularity.desc`

### REQ-5: Pedido inválido

- **Dado que** o cliente chama um dos endpoints desta feature
- **Quando** o idioma não é `en-US` nem `pt-BR`, ou a página é menor que 1, ou o ano do texto não é inteiro positivo
- **Então** responde 400
- **E** não chama o TMDB
- **E** não enfileira nada
- **Erro** discover com `yearFrom=2015` e `yearTo=2010` → 400
- **Erro** discover com nota mínima 11 ou negativa → 400
- **Erro** discover com `runtimeFrom=140` e `runtimeTo=90` → 400
- **Erro** discover com certificação sem país, ou país sem selo → 400
- **Erro** busca por texto que também manda filtro de discover → 400  ||  os modos não se misturam

### REQ-7: Candidatos de pessoa e de palavra-chave

- **Dado que** `/search/person` para "Nolan" devolve mais de uma pessoa
- **Quando** o cliente chama a busca de pessoas com `query=Nolan` e sem idioma
- **Então** responde 200 com a lista de candidatos em `en-US`
- **E** cada candidato traz id, nome, departamento (`known_for_department`) e os títulos de `known_for`
- **E** não chama `/discover/movie` e não enfileira filme
- **Erro** `query` vazio → 400

- **Dado que** `/search/keyword` para "time travel" devolve mais de um termo
- **Quando** o cliente chama a busca de palavras-chave com `query=time travel`
- **Então** responde 200 com a lista (id e nome de cada termo)
- **E** não chama `/discover/movie`

### REQ-8: Discover com ids escolhidos, duração e certificação

- **Dado que** o cliente já escolheu os ids 234352 (Margot Robbie) e 6193 (Leonardo DiCaprio), o diretor 525 (Christopher Nolan) e a palavra-chave 4379
- **Quando** pede `cast` com esses dois ids, `director=525`, `keyword=4379`, `runtimeFrom=90`, `runtimeTo=140`, `certificationCountry=BR` e `certification=14`
- **Então** o discover pede elenco em "ou" (`234352|6193`) e direção `525`
- **E** elenco e direção juntos significam "e" (tem um desses atores e esse diretor)
- **E** pede a palavra-chave `4379`, `with_runtime.gte=90`, `with_runtime.lte=140`, `certification_country=BR` e `certification=14`
- **E** várias palavras-chave no mesmo pedido entram em "ou", no mesmo espírito do elenco
- **E** responde 200 e enfileira os hits, como no REQ-3
- **Erro** `cast`, `director` ou `keyword` com id que não é inteiro positivo → 400  ||  o discover não resolve nome

### REQ-6: TMDB indisponível

- **Dado que** o client HTTP esgotou os retries do TMDB
- **Quando** o cliente busca por texto ou por discover
- **Então** responde erro
- **E** o corpo não é uma página com zero hits
- **E** não enfileira filme

## Edge cases

- A fila rejeita o enqueue → a API ainda responde 200 com a página  ||  a busca não depende do worker
- Várias buscas ao mesmo tempo enfileiram os mesmos `tmdbId` → o job id existente (`tmdbId` + idioma) evita duplicar o trabalho
- Página acima do que o TMDB aceita → o erro do TMDB sobe como erro da API, não como lista vazia

## Contratos expostos

Quatro rotas públicas `GET /movie/catalog/{search,people,keywords,discover}` — implementadas em `packages/backend/src/domains/movies/infrastructure/http/controllers/movie-catalog-search.controller.ts:MovieCatalogSearchController`, com schemas de query/resposta em `.../http/dto/movie-catalog-search.dto.ts`, registro em `.../http/controllers/routes.ts` e docs OpenAPI em `.../http/docs/movie-catalog-search.docs.ts`.

- Filtros de lista (`genres`, `cast`, `director`, `keyword`) chegam na query string como ids separados por vírgula (ex: `?genres=28,35`).
- 200: página de `MovieSearchPage` (search e discover), `MoviePersonSearchPage` (people) e `MovieKeywordSearchPage` (keywords).
- 400: pedido inválido do REQ-5.
- Erro de TMDB: mesma família de erro HTTP já usada quando o client estoura retry (502)  ||  não é 200 com `results: []`.
