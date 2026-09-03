# Env, portas e deploy
> Atualizado em 2026-08-21 · fontes: `env.ts`, `packages/*/ .env.example`, `vercel.json`, `package.json`, `app.ts`

## O que é
Como o monorepo sobe localmente e como frontend (Vercel) e API (Oracle) se ligam.

## Como funciona
- Workspace pnpm: `dev` paralelo backend+frontend; `test` só backend; `build` só frontend.
- Backend `env.ts` (Zod): `PORT` default 3333, `REDIS_URL`, `DATABASE_URL`, `OPENROUTER_API_KEY` (obrigatória fora de test), `GEMINI_API_KEY` opcional, JWT/cookie/Google.
- Frontend: `VITE_NODE_ENV`, `VITE_BACKEND_URL`, `VITE_GOOGLE_CLIENT_ID`.
- Fastify escuta `0.0.0.0` (`server.ts`). CORS: localhost qualquer porta + `*.vercel.app`, `credentials: true`.
- Vercel: build do frontend, `outputDirectory` `packages/frontend/dist`, rewrite `/api/:path*` para a API na Oracle (IP/porta no `vercel.json`).
- API em produção: VM Oracle + PM2; Swagger em `/swagger`.

## Decisões e porquês
- Env de comportamento de auth (TTL, nome do cookie) no `.env` — secrets e timings de token juntos; Gemini/JWT/cookie/Google são sensíveis.
- Front e API desacoplados no deploy — SPA estática na Vercel, Node na Oracle.
- Rewrite `/api` — o browser em produção pode falar com a API sem CORS extra se o front usar esse prefixo; local usa `VITE_BACKEND_URL` direto na 3333.

## Notas
Portas locais típicas: API 3333, Redis 6379, Postgres 5432. Conferir o registro de portas da máquina antes de mudar. Postgres de users não está no deploy descrito no README.
