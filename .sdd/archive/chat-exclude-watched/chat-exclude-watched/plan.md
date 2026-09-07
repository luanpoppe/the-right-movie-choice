# Excluir filmes assistidos nas recomendações do chat

> **id**: `chat-exclude-watched` · **criada**: 2026-09-06 · **idioma**: pt-BR

## Contexto

Usuários logados com histórico grande recebem recomendações de filmes que já assistiram. Esta mudança adiciona um toggle no chat (padrão ligado) que, quando ativo, amplia o pool de candidatos da IA, resolve os títulos no catálogo local (Redis → Postgres → TMDB), remove os já assistidos e só então deixa o agente escolher as melhores sugestões entre o que restou.

## Decisões macro

- **Filtro na factory da `lookupMovies`**: após o batch de catálogo, remover resultados cujo `tmdbId` está `watched=true` para o usuário autenticado. **Por quê**: o modelo não conhece o histórico; um único ponto de filtro antes de devolver à IA. **Alternativa descartada**: serviço separado sem integrar na tool.
- **Retry orquestrado no backend (provider)**: até 5 rodadas de candidatos + lookup + filtro até acumular pelo menos 2 não-assistidos (ou esgotar). **Por quê**: confiabilidade sem depender do LLM chamar a tool de novo. **Alternativa descartada**: instruir o agente a chamar `lookupMovies` repetidamente via prompt.
- **Constantes nomeadas (não env var)**: pool de 25 candidatos por rodada, mínimo de 2 recomendações finais não-assistidas, teto de 5 rodadas por request. **Por quê**: valores ajustáveis depois; não são segredo.
- **Contrato HTTP**: campo opcional `excludeWatched: boolean` no body de `POST /movie/recommendation`; só tem efeito com JWT; anônimo ignora. **Por quê**: o frontend controla o toggle; o backend valida auth.
- **Toggle só no frontend (estado React)**: visível apenas para usuário logado, padrão ON; não persiste em localStorage nem no backend nesta mudança. **Por quê**: escopo mínimo; preferência de sessão.
- **Esgotamento das rodadas**: retornar melhor esforço (quantos não-assistidos existirem) e avisar no `response` que o histórico cobriu quase tudo. **Alternativa descartada**: relaxar filtro e recomendar assistidos.
- **Reúso**: `MovieCatalogLookupService.findDetailsByTitlesBatch`, tool `lookupMovies` existente, `IUserMovieEntryRepository` com novo método batch para checar `watched` por `tmdbId[]`.

## Features (executadas sequencialmente)

1. **watched-filter-pipeline** — Backend: flag no POST, filtro pós-lookup na tool, loop no provider, prompt com pool de 25 e mínimo de 2 não-assistidos.
2. **exclude-watched-toggle** — Frontend: toggle no formulário do chat (só logado, padrão ON) enviando `excludeWatched` na API.

## Escopo

**Dentro**: filtro de assistidos no fluxo de recommendation; pool ampliado (25) e loop backend (até 5×); toggle no chat para usuário logado; constantes configuráveis no código.

**Fora**: persistência do toggle (localStorage ou perfil); comportamento para guest além de ignorar a flag; alterar cota anônima; listas customizadas além de `watched`; mudar o fluxo quando `excludeWatched=false` (mantém comportamento atual).
