# Tasks: unify-recommendation-call

> Parte de [`single-recommendation-call`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F<n>.C<m>` (n = índice da feature na lista do `plan.md`; m = chunk dentro da feature).

## Chunks

### F1.C1 — Schema unificado

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/domain/entities/movie-recommendation.entity.ts`, `packages/backend/src/domains/movies/domain/entities/specs/movie-recommendation.entity.spec.ts`, `packages/backend/src/domains/movies/infrastructure/providers/specs/ai-movie-recommendation.provider.spec.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) entity → 2) spec do schema → 3) fixtures do provider spec (só o que quebrar)

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Em `MovieRecommendationSchema`, `movies` com `.min(0).max(3)` e `response: z.string().nonempty()`. Criar spec do schema (vazio ok, 4 filmes falha, `response` vazio falha). Ajustar **só fixtures** do spec do provider para o parse continuar verde; **não** unificar métodos ainda.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F1.C2 — Prompt único

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/providers/movie-recommendation-prompts.ts`, `packages/backend/src/domains/movies/infrastructure/providers/specs/movie-recommendation-prompts.spec.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) prompts → 2) spec

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Uma função (ex. `unified()`) com regras dos cards + tom do chat (curto, sem markdown, sem “outra IA”). Remover `structured()` e `chat()`. Atualizar o spec. O provider ainda pode quebrar até o C3 — neste chunk só prompts+spec de prompts; se o `pnpm test` do pacote falhar só no provider por prompt antigo, ajuste mínimo no provider para chamar `unified()` nas duas calls **sem** fundir as invokes (C3 funde). Preferível: C2 só prompts e spec; C3 troca o provider. Se C2 sozinho deixar a suíte vermelha, neste chunk atualize as duas linhas de `MovieRecommendationPrompts.*` no provider (ainda duas invokes).
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F1.C3 — Porta + uma invoke

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/application/providers/movie-recommendation.provider.ts`, `packages/backend/src/domains/movies/infrastructure/providers/ai-movie-recommendation.provider.ts`, `packages/backend/src/domains/movies/infrastructure/providers/specs/ai-movie-recommendation.provider.spec.ts`
- **Depende de**: F1.C1, F1.C2
- **Ordem de revisão**: 1) porta → 2) provider → 3) spec do provider

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Porta só `getMovieRecommendation(userMessage, chatId)` devolvendo a entidade. Provider: uma `callStructuredOutput` com schema unificado, `threadId`, prompt único; sem `ai.call`. Logs de uma call. Spec: uma invoke, sem `call`, schema inválido, threadId não engolido, zero filmes + texto ok.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F1.C4 — Use case

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/application/use-cases/get-movie-recommendation.use-case.ts`, `packages/backend/src/domains/movies/application/use-cases/get-movie-recommendation.use-case.spec.ts`
- **Depende de**: F1.C3
- **Ordem de revisão**: 1) use case → 2) spec

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: `execute` chama só `getMovieRecommendation` e devolve `{ movies, response }`. Spec: uma chamada à porta; HTTP/controller não entra neste chunk.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`
