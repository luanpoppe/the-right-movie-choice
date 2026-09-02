# Client HTTP TMDB (v3)

> **id**: `tmdb-client` · **criada**: 2026-08-31 · **idioma**: pt-BR

## Contexto

A recomendação de filmes hoje sai só do Gemini, sem catálogo real. Esta mudança habilita um client TMDB v3 no backend (`modules/tmdb`), autenticado com Bearer, com porta de catálogo em `domains/movies` — ainda **sem** ligar o agente de chat. Detalhe de engenharia: [tech-grill.md](./tech-grill.md).

## Decisões macro

- **Decisão**: API v3 + `Authorization: Bearer` (`TMDB_ACCESS_TOKEN`). **Por quê**: catálogo (search/details/providers) é v3; Bearer vale v3/v4. **Alternativa descartada**: v4 como API principal; `api_key` na query.
- **Decisão**: porta `IMovieCatalogProvider` em `domains/movies`; transporte HTTP em `src/modules/tmdb`. **Por quê**: a porta é do domínio (trocável); o vendor fica isolado. **Alternativa descartada**: porta dentro de `modules/tmdb`; adapter TMDB misturado com LangChain.
- **Decisão**: token obrigatório em `dev`/`prod`; ausente permitido em `test`. **Por quê**: boot falha cedo onde a integração deve existir; unitário sem secret. **Alternativa descartada**: token sempre obrigatório ou opcional em prod.
- **Decisão**: defaults `language=pt-BR` e região `BR`. **Por quê**: produto BR (texto e watch providers). **Alternativa descartada**: en-US; sem default no client.
- **Decisão**: testes live TMDB só local, nunca na CI; `tests: on` no SDD. **Por quê**: sem flake/secret no pipeline. **Alternativa descartada**: live se houver token na CI.
- **Decisão**: rotas debug só `dev`/`test` + guard de loopback (sem mudar `listen()`). **Por quê**: Postman local sem proxy público. **Alternativa descartada**: JWT; bind global em localhost.

## Features (executadas sequencialmente)

1. **tmdb-http-client** — Env, transporte HTTP v3 (timeout, retry 429/5xx), porta do client e erros `BaseException`, com unitários.
2. **tmdb-movie-queries** — Search e details (credits, providers, ids), DTO Zod, cache Redis de details, GETs debug e testes (unit + live local).

## Escopo

**Dentro**: porta em `domains/movies`; client HTTP, cache e rotas debug em `modules/tmdb`; search/details; cache Redis de details 24h; endpoints debug GET search/details; unitários; live opt-in local; logs sem token.

**Fora**: tools LangChain/chat; frontend; TMDB v4/listas; sessão TMDB do usuário; nota IMDb; helper de imagem na UI; cache de search.
