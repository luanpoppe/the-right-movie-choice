# Cadastro de usuários
> Atualizado em 2026-08-21 · fontes: `CreateUserUseCase`, `PrismaUserRepository`, `UserEntity`, `prisma/schema.prisma`

## O que é
Registro com e-mail, nome e senha. Persistência Prisma/Postgres. Não emite sessão: o cliente faz login em seguida.

## Como funciona
- `POST /users/register` → `createUserController` → `CreateUserUseCase`.
- Se o e-mail já tem `passwordHash` → `UserAlreadyExistsException`.
- Se o e-mail existe só via Google (`passwordHash` nulo) → `setPasswordHash` (vincula senha à conta existente).
- Senão `create` com hash bcrypt (`BCRYPT_SALT_ROUNDS`). Modelo `User`: `email` unique, `googleId` unique opcional, `passwordHash` opcional.
- Repositório: `PrismaUserRepository` / `PrismaUserCredentialsRepository`. Unique do Prisma também vira 409 no error handler (`PrismaUtil`).

## Decisões e porquês
- Senha opcional no schema — contas só-Google não têm hash.
- Merge Google→senha no register — mesma regra de conta única do login Google.
- Users em `modules/` (não `domains/`) — módulo mais novo no padrão Clean Architecture do projeto.

## Notas
Logs Pino (`Logger`) no cadastro. Produção Oracle (README) ainda pode não ter Postgres; módulo pensado para local e evolução.
