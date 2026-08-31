# Tasks: guest-chat-lock

> Parte de [`movie-auth-and-refresh`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F<n>.C<m>` (n = índice da feature na lista do `plan.md`; m = chunk dentro da feature).

## Chunks

### F3.C1 — Remaining do header no service

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/features/movies/utils/guest-remaining.utils.ts`, `packages/frontend/src/features/movies/services/movie-recommendation.service.ts`, `packages/frontend/src/features/movies/utils/specs/guest-remaining.utils.spec.ts`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) util → 2) service → 3) spec

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: parse de `X-Guest-Remaining` (Axios minúsculo); `getRecommendations` devolve `guestRemaining` (`number | null`) junto do DTO, sem quebrar o destructuring `{ movies, response }` da Home
- [x] **Validação**: `npx jest src/features/movies/utils/specs/guest-remaining.utils.spec.ts` em `packages/frontend`

### F3.C2 — Estado de lock na Home

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/features/movies/utils/guest-chat-lock.utils.ts`, `packages/frontend/src/pages/Home.tsx`, `packages/frontend/src/features/welcome/Welcome.tsx` (ou o arquivo que a Home já importa), `packages/frontend/src/features/chat/Chat.tsx` (ou equivalente)
- **Depende de**: F3.C1
- **Ordem de revisão**: 1) Home (regra) → 2) props até Welcome/Chat

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: flag de lock em memória; remaining 0 anônimo ou 401 sem token trava; reset não zera o flag; `useAuth` com token não trava; 401 anônimo sem toast genérico; passar `isGuestLocked` para Welcome e Chat
- [x] **Validação**: `npx tsc -b --pretty false` em `packages/frontend` (ignorar erros pré-existentes fora destes arquivos)

### F3.C3 — Input disabled e banner de conta

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/features/movies/components/guest-lock-banner.tsx`, `packages/frontend/src/features/chat/components/ChatForm.tsx`, `packages/frontend/src/features/welcome/components/Form.tsx`, `packages/frontend/src/features/welcome/components/InputSuggestions.tsx`
- **Depende de**: F3.C2
- **Ordem de revisão**: 1) banner → 2) ChatForm → 3) Form da Welcome

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: banner PT-BR com CTA `/register` e link `/login`; input e submit `disabled` quando lock (além de loading); chips da Welcome não devem enviar se lock
- [x] **Validação**: `npx tsc -b --pretty false` em `packages/frontend`
