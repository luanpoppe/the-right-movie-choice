# Spec: Toggle no chat para excluir assistidos

> Parte de [`chat-exclude-watched`](../../plan.md)

## Resumo

Usuário autenticado vê um toggle no formulário do chat (welcome e conversa) para ligar ou desligar a exclusão de filmes já assistidos. Padrão ligado; o valor vai no body de cada `POST /movie/recommendation` como `excludeWatched`. Visitante anônimo não vê o controle.

## Requirements

### REQ-1: Toggle visível só para autenticado

- **Dado que** o usuário está autenticado na home (`accessToken` presente)
- **Quando** a welcome ou o chat renderiza o formulário de envio
- **Então** o toggle de exclusão de assistidos aparece acima ou junto ao campo de mensagem
- **E** o toggle inicia ligado

### REQ-2: Anônimo não vê o toggle

- **Dado que** o visitante está anônimo (sem `accessToken`)
- **Quando** a welcome ou o chat renderiza o formulário
- **Então** o toggle não é exibido
- **E** o body do POST não inclui `excludeWatched`

### REQ-3: Envio com exclusão ligada

- **Dado que** o usuário autenticado envia uma mensagem com o toggle ligado
- **Quando** `MovieRecommendationService.getRecommendations` é chamado
- **Então** o body inclui `excludeWatched: true` junto de `userMessage`

### REQ-4: Envio com exclusão desligada

- **Dado que** o usuário autenticado desligou o toggle
- **Quando** envia uma nova mensagem
- **Então** o body inclui `excludeWatched: false`
- **E** mensagens anteriores da conversa não são reprocessadas

### REQ-5: Estado de sessão sem persistência

- **Entrada** toggle alterado várias vezes na mesma sessão, sem recarregar a página
- **Saída** cada submit usa o valor atual do estado React em `Home`
- **E** não há gravação em `localStorage`, cookie nem API de preferências

### REQ-6: Reset do chat restaura padrão

- **Dado que** o usuário autenticado desligou o toggle e clicou em voltar/resetar o chat
- **Quando** a welcome é exibida de novo
- **Então** o toggle volta ligado

### REQ-7: Toggle desabilitado durante loading

- **Dado que** uma recommendation está em andamento (`isLoading: true`)
- **Quando** o formulário está visível
- **Então** o toggle não pode ser alterado até o loading terminar

### REQ-8: Contrato do request no frontend

- **Entrada** `MovieRecommendationRequestDTO` com `userMessage: "filme de sci-fi"`
- **Saída** schema Zod aceita `excludeWatched?: boolean` opcional além de `userMessage`
- **Erro** `userMessage` vazio continua inválido

## Edge cases

- Login no meio da sessão anônima: após obter token, o toggle aparece ligado na próxima renderização  ||  mensagens já enviadas como anônimo não são refeitas
- Logout com chat aberto: toggle some  ||  próximo envio (se houver) não manda `excludeWatched`
- Guest lock ativo: input e toggle (se visível) seguem `disabled` como o restante do formulário

## Contratos expostos

- Request: `packages/backend/src/domains/movies/infrastructure/http/dto/movie-recommendation.dto.ts:MovieRecommendationRequest`
- Frontend DTO: `packages/frontend/src/features/movies/dto/movie-recommendation.dto.ts:MovieRecommendationRequestDTOSchema`
