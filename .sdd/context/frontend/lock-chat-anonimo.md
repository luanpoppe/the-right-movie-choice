# Lock do chat anônimo

> Atualizado em 2026-08-31 · fontes: `Home.tsx`, `GuestChatLockUtils`, `GuestLockBanner`, `ChatForm`, `welcome/Form`

## O que é
Visitante usa o chat sem conta. Depois de dois POSTs 200 com `X-Guest-Remaining: 0`, ou de um 401 sem token, a UI trava o input na Welcome e no Chat e pede cadastro.

## Como funciona
- `Home` guarda `guestLockFlag` em memória. `isGuestLocked` só é true se o flag estiver ligado **e** não houver access token (`StringUtils.isEmptyString`).
- Sucesso: `GuestChatLockUtils.shouldLockAfterSuccess` (remaining === 0).
- Erro: `shouldLockOnError` (Axios 401 sem token) — sem toast genérico.
- Reset gera novo `chatId` e zera mensagens, **não** o flag. F5 some com o flag (não há storage).
- `GuestLockBanner` (PT-BR) + `disabled` em input/submit; chips da Welcome também desligam.

## Decisões e porquês
- Fonte da cota é o header/401 da API, não a contagem local de mensagens — Redis/cookie são a verdade.
- Banner, não modal; histórico permanece visível.
- Copy PT-BR; placeholders do input continuam em inglês.
- Logado nunca trava: token no contexto anula o flag.

## Notas
`GET /movie/queries` (chips) não consome cota. 401 **com** token segue o silent-refresh, não este banner.
