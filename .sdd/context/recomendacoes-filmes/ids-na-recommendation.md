# IDs na recommendation (tmdbId / imdbId)

> Atualizado em 2026-09-06 · fontes: `movie-recommendation.entity.ts` (backend + frontend), `MovieRecommendationController`

## O que é

A resposta pública de `POST /movie/recommendation` inclui `tmdbId` e `imdbId` opcionais em cada filme quando o catálogo acerta, para o SPA chamar a API de listas sem lookup por título.

## Como funciona

- **Backend**: `SingleMovieReccomendationSchema` (público) aceita `tmdbId` (`z.coerce.number().int().positive().optional()`) e `imdbId` (`z.string().min(1).optional()`). O controller mapeia cada filme com `SingleMovieReccomendationSchema.parse(movie)` — campos extras do agente (ex.: `catalogLookupIndex`) são filtrados.
- **Frontend**: mesmo schema em `packages/frontend/src/features/movies/entities/movie-recommendation.entity.ts`; `MovieRecommendationResponseDTOSchema` reutiliza o schema da entity.
- **Miss no catálogo**: filme sem IDs no fluxo interno → resposta sem propriedades `tmdbId`/`imdbId`.
- **Guest e autenticado**: mesmo shape na resposta pública.

## Decisões e porquês

- IDs no schema **público**, não só no interno — o SPA precisa do identificador estável na mesma resposta que já renderiza os cards. (origem: plan.md, spec REQ-1–3)
- `z.coerce` em `tmdbId` — alinha com `releaseYear`/`imdbRating`; LLM pode mandar string numérica sem derrubar o parse. (origem: code review F3.C1)
- `imdbId` com `.min(1)` — string vazia não passa; evita link inválido no cliente. (origem: code review F3.C1)
- `SingleMovieReccomendationInternalSchema` é alias do público — hoje não há campos só-internos além dos IDs; extensão futura exige `.extend()` de novo. (origem: F3.C1)

## Notas

- Testes: backend vitest (entity, controller, DTO) + frontend Jest (entity, DTO specs). REQ-3 (guest) só no controller backend.
- Service do SPA (`movie-recommendation.service.ts`) ainda tipa a resposta sem `parse` runtime — ver code review A2 da feature.
- Risco conhecido: `imdbId: null` do catálogo copiado literal pelo LLM pode falhar no Zod — ver code review A1.
