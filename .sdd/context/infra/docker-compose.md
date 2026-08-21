# Docker Compose
> Atualizado em 2026-08-21 · fontes: `packages/backend/docker-compose.yml`

## O que é
Sobe as dependências locais da API: Redis (chat + refresh tokens) e PostgreSQL 16 (usuários).

## Como funciona
- Projeto Compose `movie-choice`: serviços `redis` (`redis:latest`) e `postgres` (`postgres:16`).
- Portas host: `REDIS_PORT` (default 6379) e `POSTGRES_PORT` (default 5432). Credenciais locais: user/senha `app`, DB `movie_choice`.
- Volumes `redis-data` e `postgres-data`. A API Node não está no Compose — roda via pnpm/`server.ts`.

## Decisões e porquês
- Dois containers, um compose no pacote backend — o frontend não precisa de Docker.
- Defaults alinhados ao `.env.example` — `DATABASE_URL` e `REDIS_URL` apontam para localhost nessas portas.

## Notas
Produção (README): Redis via Docker na VM; Postgres de users ainda não está no deploy Oracle.
