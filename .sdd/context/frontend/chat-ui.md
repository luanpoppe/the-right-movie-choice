# Chat e welcome
> Atualizado em 2026-08-21 · fontes: `pages/Home.tsx`, `features/chat`, `features/welcome`, `MovieRecommendationService`

## O que é
Interface principal: na home, o usuário começa na welcome e, após o primeiro envio, entra no chat com mensagens e cards dos filmes recomendados.

## Como funciona
- `Home` guarda `messages` (`ChatEntity`), `chatId` (UUID), loading e se o chat já começou.
- Submit chama `MovieRecommendationService.getRecommendations` (`POST` + header `chatId`). Resposta vira turno `ai` com `movies`.
- Welcome (`Hero`, `Form`, `InputSuggestions`, `Features`) usa `MoviesQueryExamplesService` para chips de exemplo.
- Chat (`Chat`, `ChatForm`, `GoBackButton`, `LoadingScreen`) + `chat-message` / `movie-card`. Reset gera novo UUID e volta à landing.
- Existe `mockGetRecommendations` para UI sem API.

## Decisões e porquês
- Estado de conversa na `Home`, não em context global — `GlobalContext` hoje é placeholder (`exemplo`).
- Chat anônimo com UUID local — não depende de login (rotas de filme públicas).
- Welcome vs Chat como fases da mesma página — evita rota extra para a conversa.

## Notas
Erros de API viram toast (`react-hot-toast`). Chat não envia `Authorization`.
