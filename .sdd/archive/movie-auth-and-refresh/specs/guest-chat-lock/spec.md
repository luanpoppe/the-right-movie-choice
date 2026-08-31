# Spec: Lock do chat após duas mensagens anônimas

> Parte de [`movie-auth-and-refresh`](../../plan.md)

## Resumo

Visitante vê o chat normalmente. Depois de 2 POSTs 200 anônimos (`X-Guest-Remaining` = 0) ou de um 401 sem estar logado, o input trava na Welcome e no Chat; um banner pede conta (`/register` + `/login`). Logado nunca trava. Histórico permanece visível. Sem toast genérico nesse 401.

## Requirements (cenários BDD)

### REQ-1: Trava pelo header após o 2º 200

- **Dado que** o visitante não tem `authToken` e o POST de recommendation retorna 200 com `X-Guest-Remaining: 0`
- **Quando** a UI processa a resposta
- **Então** o input fica `disabled` (Welcome e Chat) e aparece o banner com CTA para `/register` e link para `/login`

### REQ-2: Trava no 401 anônimo (3ª tentativa)

- **Dado que** não há `authToken` e o POST devolve 401 (cota)
- **Quando** o erro sobe para a `Home` (o interceptor **não** chama refresh)
- **Então** trava igual ao REQ-1; **não** mostra o toast genérico atual

### REQ-3: Logado não trava

- **Dado que** existe access no `AuthContext` / `AccessTokenStorage`
- **Quando** o visitante envia mensagens ou o header de remaining viria 0
- **Então** o input continua habilitado (cota ilimitada na API)

### REQ-4: Reset não destrava; F5 destrava até a API falar de novo

- **Dado que** o chat já está travado na sessão React
- **Quando** o usuário clica reset (novo `chatId`, volta à Welcome)
- **Então** Welcome também permanece travada
- **Dado que** o usuário dá F5
- **Quando** o estado React some
- **Então** o input volta livre até o próximo 200 com remaining 0 ou 401 anônimo (sem persistir lock em storage)

## Edge cases

- Header ausente no 200 → não trava só por isso.
- `handleReset` zera mensagens mas **não** zera o flag de lock da sessão.
- Após login (token aparece), o lock some mesmo se o flag local ainda for true.
- 401 com token é silent-refresh / `/login`, não este banner.
- `GET /movie/queries` e chips da Welcome não consomem cota e não travam.
- Copy do banner em PT-BR; input continua com placeholder em inglês (já existente).

## Contratos

- Header: `GuestQuotaConstants.RESPONSE_HEADER_REMAINING` (`X-Guest-Remaining`); Axios costuma expor em minúsculas (`x-guest-remaining`).
- `MovieRecommendationService.getRecommendations` precisa devolver o remaining (ou a `Home` lê `response.headers` no client).
- Props de lock em `ChatForm` e `welcome/Form` (`disabled` além do `isLoading`).
- Rotas: `react-router` `/register` e `/login`.
- Fora: persistir lock em session/localStorage; modal; esconder o histórico.
