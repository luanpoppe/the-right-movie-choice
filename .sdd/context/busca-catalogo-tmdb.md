# Busca de catálogo no TMDB (API)

> Atualizado em 2026-10-08 · fontes: mudança `movie-catalog-search` (feature `movie-search-api`)

## O que é

Busca pública no catálogo TMDB ao vivo: por texto (`/search/movie`), por discover com filtros (`/discover/movie`) e busca de candidatos de pessoa/palavra-chave. Cada filme devolvido entra na fila de gravação do catálogo, sem upsert síncrono. É a base da página de busca (feature seguinte) e da tool do agente (feature posterior).

## Como funciona

- Rotas públicas `GET /movie/catalog/search`, `/people`, `/keywords` e `/discover` (controller `MovieCatalogSearchController`; schemas Zod em `movie-catalog-search.dto.ts`; docs em `movie-catalog-search.docs.ts`; registro em `routes.ts`). Sem `preHandler` — visitante pesquisa.
- Filtros de lista (`genres`, `cast`, `director`, `keyword`) chegam na query string como ids separados por vírgula (ex: `?genres=28,35`); o schema normaliza string ou array para `number[]` (idempotente, porque o Fastify aplica a querystring antes do `safeParse` do controller).
- Use cases: `SearchCatalogMoviesUseCase` (query vazia = populares, via discover sem filtro), `DiscoverCatalogMoviesUseCase` (valida idioma, página, nota 0–10, faixas de ano/duração e par de certificação antes do TMDB), `SearchCatalogPeopleUseCase` e `SearchCatalogKeywordsUseCase` (query obrigatória).
- Provider `IMovieCatalogProvider` (métodos `searchMovies`, `getMovieDetails`, `searchPeople`, `searchKeywords`, `discoverMovies`), implementado pelo `TmdbHttpClient`.
- Cada hit da página é enfileirado em fire-and-forget: `getMovieDetails` + `CatalogPersistEnqueuer.enqueue` rodam em background; a resposta sai sem esperar o worker e falha no enqueue só gera `Logger.warn`.

## Decisões e porquês

- Resultados vêm do TMDB ao vivo, não do Postgres primeiro — para achar filme que o catálogo local ainda não tem.
- Um contrato só para API, página e tool: texto (com página e ano) e discover (gênero, nota, anos, ator, diretor, palavra-chave, duração, certificação).
- Idioma padrão `en-US`, troca para `pt-BR`; só esses dois.
- Pessoa e palavra-chave são busca de candidatos — o chamador escolhe o id; o discover recebe ids já escolhidos e não resolve nome. Ou dentro do papel (gênero, elenco, direção, palavra-chave); elenco e direção juntos significam "e".
- Filtros de lista serializados por vírgula na query string (contrato de borda escolhido por não haver precedente de array).
- Persistência por fila (`catalog-movie-persist`), mesmo caminho do lookup atual, sem upsert síncrono.
- Discover é método novo no provider, não `searchMovies`.
