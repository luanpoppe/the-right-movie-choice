# Busca de filmes no TMDB para a biblioteca

> **id**: `movie-catalog-search` · **criada**: 2026-10-05 · **idioma**: pt-BR

## Contexto

A pessoa já marca assistido (com nota), quero ver e favorito no chat e em `/my-movies`, mas só nos filmes que o agente devolveu. Esta mudança abre uma busca direta no TMDB — por nome e por discover — numa página própria, e depois a mesma busca vira tool dos chats.

## Decisões macro

- **Decisão**: resultados vêm do TMDB ao vivo (`/search/movie` e `/discover/movie`), não do Postgres primeiro. **Por quê**: achar filme que o catálogo local ainda não tem. **Alternativa descartada**: local primeiro, TMDB no miss.
- **Decisão**: um contrato só para API, página e tool — texto (com página e ano) e discover (gênero, nota, anos, ator, diretor, palavra-chave, duração, certificação). **Por quê**: marcar um título conhecido e também explorar. **Alternativa descartada**: só um dos dois endpoints.
- **Decisão**: idioma padrão inglês, com troca fácil para pt-BR. **Por quê**: quem busca escolhe título/sinopse. **Alternativa descartada**: pt-BR fixo.
- **Decisão**: a página é pública; assistido, nota, quero ver e favorito exigem login e reusam o `UserMovieEntry` e as ações do card da biblioteca. **Por quê**: visitante pesquisa; a biblioteca continua a mesma. **Alternativa descartada**: página só logada, ou esconder favorito.
- **Decisão**: filme vindo do TMDB entra na fila de gravação do catálogo, sem upsert síncrono. **Por quê**: o mesmo caminho do lookup atual. **Alternativa descartada**: só exibir, ou gravar na hora.
- **Decisão**: reusar o client HTTP do TMDB, a fila, o PATCH de listas e os cards. Discover é método novo no provider, não `searchMovies`. **Por quê**: `/discover/movie` não é o search que já existe. **Alternativa descartada**: client paralelo ou persistência nova de listas.

## Features (executadas sequencialmente)

1. **movie-search-api** — Endpoint público de busca por texto e discover no TMDB (gênero, nota, anos, pessoa, palavra-chave, duração, certificação), com idioma e fila de gravação do catálogo.
2. **movie-search-ui** — Página dedicada para pesquisar e, logado, marcar o filme como na biblioteca.
3. **agent-search-tool** — Tool para os agentes de chat chamarem a mesma busca.

## Escopo

**Dentro**: `/search/movie` e `/discover/movie`; discover com gênero, nota, anos, ator, diretor, palavra-chave, duração e certificação; página pública; login só na ação; ações iguais à biblioteca; fila de catálogo; tool do agente em cima do mesmo caso de uso; inglês padrão e pt-BR.

**Fora**: onde assistir (provedor de streaming); mudar o chat de recomendação; modelo novo de listas.
