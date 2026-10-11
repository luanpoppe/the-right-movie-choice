# Spec: Tool de busca para o agente

> Parte de [`movie-catalog-search`](../../plan.md)

## Resumo

Tool `searchCatalog` para os agentes de chat chamarem a busca de catálogo do TMDB ao vivo — por texto/populares ou por discover escalar (gênero, nota, anos, duração, certificação). Convive com a `lookupMovies`. Devolve hits enxutos e nunca derruba o turno: falha vira miss estruturado.

## Requirements

### REQ-1: Busca por texto

- **Dado que** o modelo decide buscar um filme por nome
- **Quando** chama `searchCatalog` com `query: "Interstellar"` e `year: 2014`, sem idioma
- **Então** a tool busca por texto em `en-US`
- **E** devolve hits com id, título, ano, overview e URL do pôster
- **E** cada hit entra na fila de gravação do catálogo

### REQ-2: Populares

- **Dado que** o modelo chama `searchCatalog` sem `query` e sem nenhum filtro
- **Quando** a tool executa
- **Então** devolve os populares em `en-US`
- **E** não chama a busca por texto

### REQ-3: Discover por filtros

- **Dado que** o modelo chama `searchCatalog` com `genres: [28, 35]`, `minRating: 7` e anos de 2010 a 2015
- **Quando** a tool executa
- **Então** pede ao TMDB gênero em "ou", nota mínima e a faixa de lançamento
- **E** devolve os hits no mesmo shape do REQ-1

### REQ-4: Idioma por chamada

- **Dado que** o modelo chama `searchCatalog` com `language: "pt-BR"`
- **Quando** a tool executa
- **Então** títulos e sinopses voltam em português
- **E** sem `language` o resultado sai em `en-US`

### REQ-5: TMDB indisponível

- **Dado que** o client HTTP esgotou os retries do TMDB
- **Quando** a tool executa
- **Então** devolve um miss estruturado (sem resultados e com aviso)
- **E** não lança erro — o turno do chat continua

### REQ-6: Modos não se misturam

- **Dado que** o modelo manda `query` **e** um filtro de discover na mesma chamada
- **Quando** a tool valida a entrada
- **Então** devolve um miss estruturado de validação
- **E** não chama o TMDB
- **Erro** nota fora de 0–10 → miss estruturado  ||  anos ou duração invertidos → miss estruturado
- **Erro** certificação sem par, ou ids de lista não positivos → miss estruturado

### REQ-7: Página

- **Dado que** o modelo passa `page: 2`
- **Quando** a tool executa
- **Então** devolve a página 2 dos resultados

## Edge cases

- Lista vazia não é erro — é "nada encontrado", com aviso no retorno
- A fila rejeita o enqueue → a tool ainda devolve os hits  ||  a busca não depende do worker
- Vários hits com o mesmo id → o job id evita duplicar o trabalho
- Discover com filtros que não batem com nada → 200 do TMDB com `results` vazio, não miss

## Contratos expostos

- Tool `searchCatalog` registrada no agente de recommendation ao lado de `lookupMovies`. Params: `query` (texto), `year`, `page`, `language` (`en-US`|`pt-BR`, default `en-US`) e os filtros de discover `genres` (ids em lista, "ou"), `minRating`, `yearFrom`, `yearTo`, `runtimeFrom`, `runtimeTo`, `certificationCountry`, `certification`. Fonte: a implementação da tool.
- Retorno: `{ found: boolean, results: [{ id, title, year, overview, posterUrl }], notice?: string }`  ||  `found: false` marca miss (TMDB fora ou pedido inválido).
