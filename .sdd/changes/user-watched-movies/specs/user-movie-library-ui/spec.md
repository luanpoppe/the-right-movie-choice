# Spec: Biblioteca do usuário

> Parte de [`user-watched-movies`](../../plan.md)

## Resumo

Página autenticada `/my-movies` com abas Assistidos, Quero ver e Favoritos. Cada aba lista os filmes do usuário com título, ano e poster vindos do catálogo local, permite os mesmos toggles dos cards do chat e trata visitante com redirect para login.

## Requirements

### REQ-1: Visitante é redirecionado ao acessar a biblioteca

- **Dado que** o visitante não está autenticado
- **Quando** navega para `/my-movies`
- **Então** o SPA redireciona para `/login`
- **E** após login bem-sucedido retorna para `/my-movies`

### REQ-2: Usuário autenticado vê as três abas

- **Dado que** o usuário está logado
- **Quando** abre `/my-movies`
- **Então** vê abas "Assistidos", "Quero ver" e "Favoritos"
- **E** a aba "Assistidos" está selecionada por padrão

### REQ-3: Aba Assistidos lista filmes marcados como assistidos

- **Dado que** o usuário tem entrada `tmdbId = 157336` com `watched = true`, nota `9` e `watchedAt = 2026-03-15`
- **Quando** abre a aba Assistidos
- **Então** o SPA chama `GET /movie/user-entries?watched=true`
- **E** exibe card com título "Interestelar", ano `2014` e poster quando existir no catálogo
- **E** exibe nota `9` e data assistida `15/03/2026` no card

### REQ-4: Aba Quero ver lista a watchlist

- **Dado que** o usuário tem `tmdbId = 550` com `inWatchlist = true`
- **Quando** seleciona a aba Quero ver
- **Então** o SPA chama `GET /movie/user-entries?inWatchlist=true`
- **E** exibe card de "Clube da Luta" com os mesmos metadados de catálogo quando disponíveis

### REQ-5: Aba Favoritos lista favoritos

- **Dado que** o usuário tem `tmdbId = 27205` com `favorite = true`
- **Quando** seleciona a aba Favoritos
- **Então** o SPA chama `GET /movie/user-entries?favorite=true`
- **E** exibe card de "A Origem" com metadados de catálogo quando disponíveis

### REQ-6: Toggles nos cards da biblioteca

- **Dado que** o usuário está na aba Favoritos e o card de `tmdbId = 27205` está visível
- **Quando** desmarca o favorito pelo toggle do card
- **Então** o SPA envia `PATCH /movie/user-entries/27205` com `{ "favorite": false }`
- **E** o card some da aba Favoritos após confirmação do servidor

### REQ-7: Link no header para usuários logados

- **Dado que** o usuário está autenticado
- **Quando** visualiza qualquer página com o header
- **Então** vê link "Meus filmes" apontando para `/my-movies`

### REQ-8: Lista enriquecida com catálogo local

- **Entrada** `GET /movie/user-entries?watched=true` com JWT válido
- **Saída** `200` com `entries[]` onde cada item inclui campos atuais de `UserMovieEntry`
- **E** campo opcional `movie` com `{ title, year, posterPath }` quando existir `Movie` com mesmo `tmdbId` em `pt-BR`
- **Erro** entrada sem `movie` no catálogo → item retorna `movie: null`  ||  demais campos da entrada permanecem

### REQ-9: Ordenação por aba

- **Entrada** `GET /movie/user-entries?watched=true`
- **Saída** entradas ordenadas por `watchedAt` descendente
- **E** entradas com `watchedAt` nulo aparecem após as datadas
- **Entrada** `GET /movie/user-entries?favorite=true` ou `?inWatchlist=true`
- **Saída** entradas ordenadas por `updatedAt` descendente

### REQ-10: Card sem catálogo usa placeholder

- **Entrada** entrada com `tmdbId = 999001` e `movie: null` na resposta enriquecida
- **Saída** card exibe texto "Filme #999001"
- **E** poster substituído por placeholder visual neutro

## Edge cases

- Aba sem itens → mensagem de lista vazia com CTA para voltar ao chat e pedir recomendações
- Falha no `GET` da aba → toast de erro genérico e botão "Tentar novamente"
- Toggle que remove o filtro da aba atual → card some sem recarregar a página inteira
- Filme em múltiplas listas → aparece em cada aba correspondente de forma independente

## Contratos expostos

- `GET /movie/user-entries` — resposta enriquecida: cada `entry` ganha `movie: { title: string, year: number | null, posterPath: string | null } | null` (provisório até implementação)
- Ordenação: `watched=true` usa `watchedAt desc`; demais filtros usam `updatedAt desc` (comportamento novo no repositório)
