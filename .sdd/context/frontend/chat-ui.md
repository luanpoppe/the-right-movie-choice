# Chat e welcome
> Atualizado em 2026-08-30 · fontes: `pages/Home.tsx`, `features/chat`, `features/welcome`, `MovieRecommendationService`

## O que é
Interface principal: na home, o usuário começa na welcome e, após o primeiro envio, entra no chat com mensagens e cards dos filmes recomendados.

## Como funciona
- `Home` guarda `messages` (`ChatEntity`), `chatId` (UUID), loading, se o chat já começou e o flag de lock anônimo (ver [lock do chat anônimo](lock-chat-anonimo.md)).
- Submit chama `MovieRecommendationService.getRecommendations` (`movieClient` POST + header `chatId`). Resposta vira turno `ai` com `movies`.
- Welcome (`Hero`, `Form`, `InputSuggestions`, `Features`) usa `MoviesQueryExamplesService` para chips de exemplo.
- Chat (`Chat`, `ChatForm`, `GoBackButton`, `LoadingScreen`) + `chat-message` / `movie-card`. Reset gera novo UUID e volta à landing.

## Decisões e porquês
- Estado de conversa na `Home`, não em context global — `GlobalContext` hoje é placeholder (`exemplo`).
- Chat anônimo com UUID local — não depende de login (rotas de filme públicas).
- Welcome vs Chat como fases da mesma página — evita rota extra para a conversa.

## Notas
Erros de API viram toast (`react-hot-toast`), exceto 401 anônimo de cota (banner, sem toast). Com `authToken` no storage o POST leva Bearer; anônimo não.
