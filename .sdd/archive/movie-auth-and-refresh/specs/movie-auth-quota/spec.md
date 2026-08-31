# Spec: Cota anônima e Bearer nas rotas de filme

> Parte de [`movie-auth-and-refresh`](../../plan.md)

## Resumo

O backend aplica cota de 2 `POST /movie/recommendation` por visitante (`guest-id` httpOnly + Redis). Bearer JWT válido ignora a cota. `GET /movie/queries` permanece público, sem cota. Respostas anônimas de recommendation expõem `X-Guest-Remaining` para o SPA.

## Requirements (cenários BDD)

### REQ-1: Visitante usa até duas recomendações

- **Dado que** o cliente não envia Bearer válido e tem cookie `guest-id` (ou o servidor cria um)
- **Quando** faz o 1º ou 2º `POST /movie/recommendation` e a recomendação retorna 200
- **Então** a cota incrementa no Redis, o cookie `guest-id` é renovado (TTL 1 dia, httpOnly) e a resposta inclui `X-Guest-Remaining` (1 após a primeira, 0 após a segunda)

### REQ-2: Terceira recomendação anônima recusada

- **Dado que** o visitante já tem 2 POSTs 200 contabilizados para aquele `guest-id`
- **Quando** envia outro `POST /movie/recommendation` sem Bearer válido
- **Então** a API responde 401 e não chama o LLM; `X-Guest-Remaining` é 0

### REQ-3: Bearer válido é ilimitado

- **Dado que** o `Authorization: Bearer` verifica com o provider JWT existente (`JoseAccessTokenProvider`)
- **Quando** faz `POST /movie/recommendation`
- **Então** a cota do cookie/Redis é ignorada e a recomendação segue; header de cota não é obrigatório

### REQ-4: Queries públicas sem cota

- **Dado que** qualquer cliente (anônimo ou logado)
- **Quando** chama `GET /movie/queries`
- **Então** a rota não exige Bearer, não incrementa cota e não depende de `guest-id`

## Edge cases

- Bearer presente mas inválido ou expirado → 401; não cai na cota anônima.
- Falha após aceitar o POST (LLM, schema, etc.) → não incrementa a cota.
- Novo `chatid` com o mesmo `guest-id` → a cota não reseta.
- Cookie `guest-id` ausente no 1º POST anônimo → o servidor gera UUID, `Set-Cookie`, conta a partir do 200.
- Cookie expirado (TTL 1 dia) → novo `guest-id` e cota zerada.
- CORS: expor `X-Guest-Remaining` (`exposedHeaders` no `@fastify/cors`) para o SPA ler o header.

## Contratos

- Rotas atuais: `packages/backend/src/domains/movies/infrastructure/http/controllers/routes.ts` (`POST /movie/recommendation`, `GET /movie/queries`). Header `chatid` permanece obrigatório no POST.
- Cookie: nome `guest-id`, httpOnly, TTL 1 dia, credentials já liberadas no CORS (`app.ts`).
- Redis: contador por `guest-id` (chave de domínio, ex. `guest:quota:<id>`). Limite = constante nomeada `2` (não env).
- Header de resposta (só anônimo no POST recommendation): `X-Guest-Remaining` com `0`, `1` ou `2`.
- Verificação JWT: reusar `IAccessTokenProvider` / `JoseAccessTokenProvider`; hook Fastify nas rotas de filme.
- Fora desta spec: interceptor de refresh no SPA; lock do input no chat.
