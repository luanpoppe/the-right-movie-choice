# Spec: IDs na recommendation

> Parte de [`user-watched-movies`](../../plan.md)

## Resumo

Inclui `tmdbId` e `imdbId` opcionais em cada filme da resposta pública de `POST /movie/recommendation`, no backend e no schema do SPA, para o cliente chamar a API de listas sem lookup por título.

## Requirements

### REQ-1: Filme com hit no catálogo expõe os dois IDs

- **Dado que** o agente recomendou "Inception" com `tmdbId = 27205` e `imdbId = "tt1375666"` no fluxo interno
- **Quando** o cliente recebe `POST /movie/recommendation` com sucesso
- **Então** o objeto do filme na resposta contém `tmdbId = 27205`
- **E** contém `imdbId = "tt1375666"`

### REQ-2: Filme sem match no catálogo não expõe IDs

- **Dado que** o agente recomendou um filme sem `tmdbId` nem `imdbId` no fluxo interno (miss no catálogo)
- **Quando** o cliente recebe `POST /movie/recommendation` com sucesso
- **Então** o objeto do filme não inclui `tmdbId`
- **E** não inclui `imdbId`

### REQ-3: Visitante anônimo recebe os mesmos IDs

- **Dado que** a requisição é de guest com cookie de quota válido
- **Quando** a recommendation retorna filme com IDs no fluxo interno
- **Então** a resposta pública inclui `tmdbId` e `imdbId` da mesma forma que para usuário autenticado

### REQ-4: Schema público aceita IDs opcionais

- **Entrada** filme interno com `tmdbId = 603` e sem `imdbId`
- **Saída** objeto público válido com `tmdbId = 603`
- **E** sem propriedade `imdbId`

### REQ-5: DTO HTTP do backend valida IDs na resposta

- **Entrada** `MovieRecommendationResponseDTO` com `movies[0].tmdbId = 157336`
- **Saída** parse Zod aceita o payload
- **Erro** `tmdbId = 0` → validação falha antes de serializar

### REQ-6: Schema do SPA espelha o contrato público

- **Entrada** JSON de recommendation com `movies[0].tmdbId = 550` e `imdbId = "tt0137523"`
- **Saída** `SingleMovieReccomendationSchema` do frontend aceita o payload
- **E** o tipo inferido expõe `tmdbId` e `imdbId` como opcionais

## Edge cases

- Só `tmdbId` sem `imdbId` quando o catálogo tem TMDB mas não IMDb  ||  resposta expõe apenas `tmdbId`
- Filme com IDs inválidos no fluxo interno (ex.: `tmdbId` negativo)  ||  validação do schema público rejeita antes da resposta HTTP
- Resposta com até 3 filmes  ||  cada item segue REQ-1 ou REQ-2 independentemente

## Contratos expostos

- `POST /movie/recommendation` — cada item de `movies[]` ganha `tmdbId?` (inteiro positivo) e `imdbId?` (string não vazia). Demais campos inalterados.
- `packages/backend/src/domains/movies/domain/entities/movie-recommendation.entity.ts:SingleMovieReccomendationSchema`
- `packages/frontend/src/features/movies/entities/movie-recommendation.entity.ts:SingleMovieReccomendationSchema`
