# Spec: API de listas do usuário

> Parte de [`user-watched-movies`](../../plan.md)

## Resumo

Expõe endpoints HTTP autenticados (JWT) para consultar e atualizar o status de um filme por `tmdbId` — assistido (com nota e data opcionais), favorito e watchlist — e listar as entradas do usuário. Delega persistência a `IUserMovieEntryRepository`; não enriquece com dados TMDB nesta feature.

## Requirements

### REQ-1: Marcar filme como assistido com nota

- **Dado que** o usuário autenticado `id = 42` envia `Authorization: Bearer` válido
- **Quando** faz `PATCH /movie/user-entries/157336` com body `{ "watched": true, "rating": 9 }`
- **Então** retorna `200` com `entry` contendo `tmdbId = 157336`, `watched = true`, `rating = 9`
- **E** `entry.watchedAt` permanece `null` se o cliente não enviou `watchedAt`

### REQ-2: Alternar favorito

- **Dado que** já existe entrada para `tmdbId = 550` com `favorite = false`
- **Quando** o usuário autenticado faz `PATCH /movie/user-entries/550` com `{ "favorite": true }`
- **Então** retorna `200` com `entry.favorite = true`
- **E** os demais campos da entrada permanecem como estavam

### REQ-3: Alternar watchlist

- **Dado que** não há entrada para `tmdbId = 27205`
- **Quando** o usuário autenticado faz `PATCH /movie/user-entries/27205` com `{ "inWatchlist": true }`
- **Então** retorna `200` criando entrada com `inWatchlist = true` e flags ausentes como `false`

### REQ-4: Listar entradas por flag

- **Dado que** o usuário `id = 42` tem entradas A (`watched = true`), B (`favorite = true`), C (`inWatchlist = true`)
- **Quando** faz `GET /movie/user-entries?watched=true` com JWT válido
- **Então** retorna `200` com `entries` contendo somente A
- **E** `GET /movie/user-entries` sem query retorna todas as entradas do usuário

### REQ-5: Consultar uma entrada

- **Dado que** existe entrada para `(userId = 42, tmdbId = 157336)`
- **Quando** o usuário autenticado faz `GET /movie/user-entries/157336`
- **Então** retorna `200` com `entry` completo
- **E** se não existir entrada, retorna `404`

### REQ-6: Remover entrada ao desmarcar tudo

- **Dado que** existe entrada com os três flags `false` após merge do patch
- **Quando** o usuário autenticado faz `PATCH` que zera `watched`, `favorite` e `inWatchlist`
- **Então** retorna `200` com `{ "entry": null }`
- **E** leitura posterior por `GET /movie/user-entries/:tmdbId` retorna `404`

### REQ-7: Rejeitar acesso sem autenticação

- **Dado que** a requisição não envia `Authorization: Bearer`
- **Quando** chama qualquer rota de `/movie/user-entries`
- **Então** retorna `401`
- **E** não consulta o repositório

### REQ-8: Rejeitar token inválido

- **Dado que** o header `Authorization` traz Bearer expirado ou inválido
- **Quando** chama `PATCH /movie/user-entries/157336`
- **Então** retorna `401`
- **E** não altera persistência

### REQ-9: Preservar flags não enviados no PATCH

- **Entrada** entrada existente com `watched = true`, `favorite = true`  ||  body `{ "inWatchlist": true }`
- **Saída** `200` com `watched` e `favorite` ainda `true`
- **E** `inWatchlist = true`

### REQ-10: Validar path e body antes do repositório

- **Entrada** `PATCH /movie/user-entries/0` com body válido
- **Erro** `400` — `tmdbId` inválido no path
- **Erro** `PATCH` com `{ "rating": 11 }` → `400` antes de persistir
- **Erro** body `{}` sem nenhuma chave de patch → `400`

## Edge cases

- Várias query flags (`watched=true&favorite=true`) → filtro AND no repositório  ||  retorna entradas que satisfazem todas
- `watchedAt` explícito `null` no body → limpa o campo na entrada persistida
- Concorrência: dois PATCH no mesmo `tmdbId` → última escrita vence  ||  unique `(userId, tmdbId)` no banco

## Contratos expostos

- `PATCH /movie/user-entries/:tmdbId` — body parcial: `watched?`, `favorite?`, `inWatchlist?`, `rating?` (1–10 ou `null`), `watchedAt?` (ISO 8601 ou `null`). Resposta `200`: `{ entry: UserMovieEntryResponse | null }`.
- `GET /movie/user-entries/:tmdbId` — resposta `200`: `{ entry: UserMovieEntryResponse }` ou `404` se ausente.
- `GET /movie/user-entries` — query opcional `watched`, `favorite`, `inWatchlist` (boolean). Resposta `200`: `{ entries: UserMovieEntryResponse[] }`.
- `UserMovieEntryResponse` (provisório): `tmdbId`, `movieId`, `watched`, `favorite`, `inWatchlist`, `rating`, `watchedAt`, `createdAt`, `updatedAt` — datas em ISO string; sem `userId` no payload público.
- Autenticação: `Authorization: Bearer` obrigatório em todas as rotas  ||  `401` se ausente ou inválido.
- Erros de validação de domínio: `400` com mensagem  ||  mesma família de `UserMovieEntryValidationException`.
