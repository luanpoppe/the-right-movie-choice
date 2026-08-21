# Autenticação e usuários
> Módulos `src/modules/auth` e `src/modules/users`. Emissão de sessão centralizada.

## Áreas
- [JWT e refresh](jwt-refresh.md) — access no body, refresh httpOnly no Redis com rotação.
- [Login Google](google.md) — ID token, e-mail verificado, conta unificada.
- [Cadastro de usuários](cadastro-usuarios.md) — `POST /users/register`, Prisma + bcrypt, merge com conta Google.
