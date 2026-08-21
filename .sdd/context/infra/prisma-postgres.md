# Prisma e Postgres
> Atualizado em 2026-08-21 · fontes: `prisma/schema.prisma`, `prisma.config.ts`, `lib/prisma`, `PrismaUserRepository`

## O que é
Persistência relacional só do módulo de usuários. Filmes e histórico de chat não passam pelo banco.

## Como funciona
- Provider PostgreSQL; client gerado em `packages/backend/generated/prisma` (`generator` `prisma-client`).
- Modelo único `User` (id, email unique, name, passwordHash opcional, googleId unique opcional, timestamps).
- Adapters: `PrismaUserRepository`, `PrismaUserCredentialsRepository`. Unique violation → 409 (`PrismaUtil` no error handler).
- `DATABASE_URL` obrigatória no `env.ts` mesmo se o fluxo de filme não usar o banco.

## Decisões e porquês
- Prisma só em users — movies é LLM + Redis; não há catálogo próprio de filmes.
- Client gerado fora de `node_modules` — output explícito no schema.

## Notas
Vitest cobre use cases de users/auth. Migrações/uso em produção Oracle ainda incompletos segundo o README.
