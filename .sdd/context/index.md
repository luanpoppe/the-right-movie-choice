# Contexto do projeto — The Right Movie Choice
> Como as funcionalidades do projeto funcionam (macro + decisões). Mantido pelos fluxos lp:* e por lp:context. LIDO no início de todo fluxo.

## Áreas / funcionalidades
- [Recomendações de filmes](recomendacoes-filmes/index.md) — chat com Gemini, histórico Redis, cota anônima no POST `/movie/recommendation` e `GET /movie/queries` público.
- [Autenticação e usuários](auth/index.md) — JWT, refresh httpOnly, Google OAuth e cadastro unificado por e-mail.
- [Frontend](frontend/index.md) — chat de recomendações, lock anônimo, login/register, refresh silencioso no SPA e shell (header + tema).
- [Infraestrutura](infra/index.md) — Docker (Redis/Postgres), Prisma, env, portas e deploy Vercel/Oracle.
- [Catálogo TMDB](catalogo-tmdb.md) — client HTTP v3 (Bearer, timeout/retry) atrás de `IMovieCatalogProvider`; ainda sem cache nem rotas debug.
