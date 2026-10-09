# Busca de filmes (página /search)

> Atualizado em 2026-10-09 · fontes: mudança `movie-catalog-search` (feature `movie-search-ui`)

## O que é

Página pública `/search` (link no Header) para achar filme no catálogo TMDB por texto ou por filtros de discover e, logado, marcar na biblioteca com as mesmas ações dos cards do chat.

## Como funciona

- Rota pública em `routes/index.tsx`; link "Search" no `Header`.
- Estado na URL (query string): busca, filtros de discover, idioma e página — `CatalogSearchFiltersUtils.parse/serialize`.
- `useCatalogSearch` orquestra: valida (`CatalogSearchFiltersValidationUtils`), resolve o modo (discover / busca por texto / populares quando vazio) e chama `MovieCatalogSearchService`; descarta resposta obsoleta (`activeFetchIdRef`) e anexa páginas no "Carregar mais".
- Componentes: `CatalogSearchBar` (texto + idioma), `CatalogSearchFiltersPanel` + `CandidateSearchCombobox` (gênero, nota, anos, duração, certificação; ator/diretor/palavra-chave por candidatos), `CatalogSearchResults` + `SearchMovieCard`.
- Ações: `SearchMovieCard` reusa `MovieCardListActions`; a página só envolve `UserMovieEntriesProvider` quando há login. Visitante nas ações vai para `/login?redirect=<url atual>`.
- Pôster: a API de catálogo devolve a URL **absoluta** do pôster (correção `F1.C11`); o card usa `TmdbPosterUtils.resolvePosterUrl`.

## Decisões e porquês

- Discover completo, incluindo ator/diretor/palavra-chave por combobox de candidatos (ids) — o chamador escolhe o id.
- Filtros na URL: compartilhável e o voltar/recarregar funciona; listas de ids separadas por vírgula.
- Busca explícita (Enter/botão), não a cada tecla; com query vazia a página mostra populares no load.
- "Carregar mais" em vez de paginação; `hasMore` é heurístico (`results.length > 0`) porque o contrato não traz `totalPages`.
- Gênero por lista fixa de 18 gêneros comuns do TMDB.
- Idioma `en-US`/`pt-BR` com toggle; default `en-US`.
- Login só na ação; o visitante volta para a mesma busca/filtros.

## Notas

- `RegisterPage` não honra `?redirect=` — só o login tem retorno (REQ-8 fala do login).
- Há 3 aliases do tipo de idioma no SPA: `MovieCatalogLanguage` (dto), `CatalogSearchLanguage` (utils) e `CatalogLanguage` (barra) — unificar depois.
