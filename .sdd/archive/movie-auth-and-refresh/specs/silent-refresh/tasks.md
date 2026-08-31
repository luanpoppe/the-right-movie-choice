# Tasks: silent-refresh

> Parte de [`movie-auth-and-refresh`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F<n>.C<m>` (n = índice da feature na lista do `plan.md`; m = chunk dentro da feature).

## Chunks

### F2.C1 — Client de movies com Bearer e credentials

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/features/auth/utils/access-token.storage.ts`, `packages/frontend/src/lib/api/movie-client.ts`, `packages/frontend/src/lib/api/specs/movie-client.spec.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) storage → 2) movie-client → 3) spec

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: leitura/gravação do `authToken` no sessionStorage; axios de movies com `withCredentials` e interceptor de request que anexa `Authorization` se houver token
- [x] **Validação**: `npx jest src/lib/api/specs/movie-client.spec.ts` em `packages/frontend`

### F2.C2 — Interceptor 401: refresh single-flight e um retry

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/lib/api/movie-silent-refresh.ts`, `packages/frontend/src/lib/api/movie-client.ts`, `packages/frontend/src/lib/api/specs/movie-silent-refresh.spec.ts`
- **Depende de**: F2.C1
- **Ordem de revisão**: 1) silent-refresh → 2) wire no movie-client → 3) spec

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: 401 só se houver token → `AuthService.refresh`, um refresh por vez, grava access no storage, retenta a request uma vez; sem token o 401 sobe; segunda 401 chama o handler de sessão expirada (stub injetável neste chunk)
- [x] **Validação**: `npx jest src/lib/api/specs/movie-silent-refresh.spec.ts` em `packages/frontend`

### F2.C3 — Ponte AuthContext + service de recommendation

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/features/auth/context/AuthContext.tsx`, `packages/frontend/src/features/movies/services/movie-recommendation.service.ts`
- **Depende de**: F2.C2
- **Ordem de revisão**: 1) handler + AuthContext (navigate/logout) → 2) service usa movie-client

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: registrar callback de sessão expirada no AuthContext (`logout` + `navigate('/login')`); `MovieRecommendationService` usa o movie-client (chatId + body)
- [x] **Validação**: `npx tsc -b --pretty false` em `packages/frontend`
