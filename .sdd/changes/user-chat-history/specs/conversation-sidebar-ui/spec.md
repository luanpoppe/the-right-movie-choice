# Spec: Sidebar de conversas

> Parte de [`user-chat-history`](../../plan.md)

## Resumo

Para usuários logados, adiciona navegação de histórico no SPA: Home permanece focada em iniciar chat (sem lista); header leva a uma página de listagem com CRUD; ao conversar, rota `/conversations/:id` mostra chat com sidebar de conversas. Primeira mensagem na Home cria conversa na API e navega para o chat. Guests mantêm fluxo atual sem listagem nem sidebar.

## Requirements

### REQ-1: Home sem sidebar para logado

- **Dado que** o usuário está autenticado na rota `/`
- **Quando** a Home renderiza o Welcome ou inicia um chat novo a partir dela
- **Então** não exibe sidebar de conversas
- **E** o layout permanece focado em começar uma conversa

### REQ-2: Link de listagem no header

- **Dado que** o usuário está autenticado
- **Quando** qualquer página com header renderiza
- **Então** exibe link no header para a listagem de conversas
- **E** o link não aparece para usuário anônimo

### REQ-3: Página de listagem com CRUD

- **Dado que** o usuário autenticado acessa `/conversations`
- **Quando** a página carrega
- **Então** busca `GET /movie/conversations` e lista itens por `updatedAt` descendente
- **E** cada item permite abrir, renomear inline e excluir (com confirmação)
- **E** título `null` exibe `New Conversation` seguido de data/hora relativa em inglês

### REQ-4: Primeira mensagem cria conversa e abre chat com sidebar

- **Dado que** o usuário autenticado envia a primeira mensagem no Welcome da Home
- **Quando** o submit é processado
- **Então** chama `POST /movie/conversations` antes de `POST /movie/recommendation`
- **E** usa o `chatId` retornado no header `chatId` da recommendation
- **E** navega para `/conversations/:id` da conversa criada
- **E** a tela de chat exibe sidebar de conversas para o usuário logado

### REQ-5: Retomar conversa na rota dedicada

- **Dado que** existe conversa `id = 12` do usuário logado
- **Quando** o usuário abre `/conversations/12` (da listagem ou da sidebar)
- **Então** carrega `GET /movie/conversations/12` com histórico de mensagens
- **E** renderiza mensagens no chat
- **E** exibe sidebar com a conversa ativa destacada

### REQ-6: Sidebar no chat — trocar, renomear e excluir

- **Dado que** o usuário autenticado está em `/conversations/:id`
- **Quando** interage com a sidebar
- **Então** pode abrir outra conversa da lista
- **E** pode renomear inline (PATCH) o item selecionado
- **E** excluir exige dialog de confirmação antes do DELETE
- **E** botão "Nova conversa" redireciona para `/` no estado Welcome (sem sidebar)

### REQ-7: Excluir conversa aberta

- **Dado que** o usuário confirma exclusão da conversa atualmente aberta em `/conversations/:id`
- **Quando** o DELETE conclui com sucesso
- **Então** redireciona para `/` no estado Welcome

### REQ-8: Guest inalterado

- **Dado que** o usuário é anônimo
- **Quando** usa a Home
- **Então** não vê link de listagem nem sidebar
- **E** mantém `chatId` gerado no cliente e fluxo de cota/lock existente

### REQ-9: Mapeamento de histórico para o chat

- **Entrada** resposta de `GET /movie/conversations/:id` com `messages` no formato `ChatHistoryEntity`
- **Saída** array `ChatEntity` compatível com o componente `Chat` atual (`from: "user"|"ai"`, texto e `movies` quando houver)

### REQ-10: Erros de API na UI

- **Entrada** falha em listar, carregar, renomear ou excluir conversa
- **Saída** toast de erro em inglês (padrão do SPA)  ||  estado de loading desligado
- **Erro** `404` ao abrir `/conversations/:id` inexistente → redireciona para `/conversations`

## Edge cases

- Listagem vazia em `/conversations` → estado vazio com CTA para voltar à Home e iniciar conversa
- Falha no `POST /movie/conversations` na primeira mensagem → não chama recommendation  ||  toast de erro
- Renomear com título vazio → não envia PATCH (ou validação local equivalente)
- Sidebar e listagem devem refletir `updatedAt` após novo turno no chat aberto (re-fetch ou atualização local após recommendation)

## Contratos expostos

- Rotas SPA: `/conversations`, `/conversations/:id` (param `id` numérico da conversa)
- `packages/backend/src/domains/movies/infrastructure/http/controllers/user-conversation.controller.ts:UserConversationControllerHandlers`
- `packages/frontend/src/features/movies/services/movie-recommendation.service.ts:MovieRecommendationService.getRecommendations` (header `chatId` inalterado)
