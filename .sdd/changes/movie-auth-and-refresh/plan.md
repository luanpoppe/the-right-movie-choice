# Auth nas rotas de filme, refresh silencioso e cota de anônimo

> **id**: `movie-auth-and-refresh` · **criada**: 2026-08-21 · **idioma**: pt-BR

## Contexto

Visitante usa o chat sem conta, mas `/movie/recommendation` é público e o SPA não renova o access. Esta mudança limita o anônimo a 2 recomendações (backend + UI), exige sessão JWT para o restante e renova o access no 401 via refresh já existente.

## Decisões macro

- **Decisão**: anônimo pode `POST /movie/recommendation` até 2 vezes; da 3ª o backend recusa (401). Logado (Bearer válido) é ilimitado. **Por quê**: a regra precisa valer na API, não só na UI. **Alternativa descartada**: API pública com trava só no front; Bearer obrigatório em todo POST (bloqueia as 2 msgs anônimas).
- **Decisão**: `GET /movie/queries` continua público, sem cota. **Por quê**: não é envio de mensagem no chat. **Alternativa descartada**: contar queries na cota ou exigir Bearer.
- **Decisão**: identificar anônimo por cookie/id persistente, não só por `chatid`. **Por quê**: novo `chatid` não deve resetar a cota. **Alternativa descartada**: cota só por `chatid` ou por IP.
- **Decisão**: refresh silencioso no SPA só após 401 do access (`POST /auth/refresh` + retry). **Por quê**: reusa cookie httpOnly e `AuthService.refresh`. **Alternativa descartada**: timer por `expiresIn` ou os dois.
- **Decisão**: reusar hook Fastify, Redis, `chatid`, `AuthSessionFacade`, `authClient` (`withCredentials`) e `AuthContext`. **Por quê**: sessão e chat já existem. **Alternativa descartada**: módulo de guest isolado do auth atual.
- **Decisão**: ordem movie-auth-quota → silent-refresh → guest-chat-lock. **Por quê**: a API define a cota; o refresh evita 401 de access expirado no logado; a UI só trava o input. **Alternativa descartada**: UI antes do backend; refresh antes da cota.

## Features (executadas sequencialmente)

1. **movie-auth-quota** — Hook nas rotas de filme: Bearer ilimitado; anônimo com cookie de cota (2 POSTs de recommendation); `GET /movie/queries` público.
2. **silent-refresh** — Interceptor no SPA: 401 no access dispara refresh com cookie e retenta a request.
3. **guest-chat-lock** — Chat visível sem conta; após 2 envios trava o input e pede criar conta.

## Escopo

**Dentro**: cota de 2 recomendações anônimas no backend; Bearer para o restante; cookie de guest; refresh no 401; UI de lock com mensagem para criar conta.

**Fora**: unlink Google; set-password; Postgres em produção; histórico/listas pessoais; guard que esconde o chat; exigir login para ver a conversa.
