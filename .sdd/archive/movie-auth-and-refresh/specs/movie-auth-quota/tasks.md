# Tasks: movie-auth-quota

> Parte de [`movie-auth-and-refresh`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F<n>.C<m>` (n = índice da feature na lista do `plan.md`; m = chunk dentro da feature).

## Chunks

### F1.C1 — Persistência da cota no Redis

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/domain/guest-quota.constants.ts`, `packages/backend/src/domains/movies/domain/repositories/guest-quota.repository.ts`, `packages/backend/src/domains/movies/infrastructure/repositories/redis-guest-quota.repository.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `guest-quota.constants.ts` → 2) `guest-quota.repository.ts` → 3) `redis-guest-quota.repository.ts`

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: constante limite 2 + porta `IGuestQuotaRepository` + Redis (`guest:quota:<id>`, TTL 1 dia)
- [x] **Validação**: `npx vitest run --project unit` em `packages/backend`

### F1.C2 — Serviço de cota (remaining e incremento)

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/application/guest-quota.service.ts`, `packages/backend/src/domains/movies/domain/exceptions/guest-quota-exceeded.exception.ts`, `packages/backend/src/domains/movies/application/specs/guest-quota.service.spec.ts`
- **Depende de**: F1.C1
- **Ordem de revisão**: 1) exception → 2) service → 3) spec

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: serviço que calcula remaining (limit - used), sabe se pode aceitar POST anônimo, incrementa só quando chamado após 200; exception 401 se cota esgotada
- [x] **Validação**: `npx vitest run --project unit` em `packages/backend`

### F1.C3 — Hook Fastify Bearer vs visitante

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/http/hooks/movie-recommendation-auth.hook.ts`, `packages/backend/src/domains/movies/domain/exceptions/invalid-access-token.exception.ts`, `packages/backend/src/domains/movies/infrastructure/http/hooks/specs/movie-recommendation-auth.hook.spec.ts`
- **Depende de**: F1.C2
- **Ordem de revisão**: 1) exception Bearer → 2) hook → 3) spec

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: preHandler — Bearer válido ignora cota; Bearer inválido/expirado 401 sem cota; sem Bearer lê/gera guest-id e recusa se cota esgotada (ainda sem Set-Cookie/header HTTP)
- [x] **Validação**: `npx vitest run --project unit` em `packages/backend`

### F1.C4 — Wire na rota, cookie, header e CORS

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/domains/movies/infrastructure/http/controllers/routes.ts`, `packages/backend/src/domains/movies/infrastructure/http/controllers/movie-recommendation.controller.ts`, `packages/backend/src/app.ts`
- **Depende de**: F1.C3
- **Ordem de revisão**: 1) hook na rota POST → 2) increment+cookie+header no 200 → 3) CORS exposeHeaders; GET /movie/queries intacto

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: registra o hook só no POST recommendation; no 200 anônimo incrementa Redis, Set-Cookie `guest-id` httpOnly TTL 1 dia, header `X-Guest-Remaining`; CORS `exposeHeaders`; queries sem cota
- [x] **Validação**: `npx vitest run --project unit` em `packages/backend`
