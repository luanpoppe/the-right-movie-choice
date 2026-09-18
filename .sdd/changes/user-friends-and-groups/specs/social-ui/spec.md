# Spec: UI social

> Parte de [`user-friends-and-groups`](../../plan.md)

## Resumo

SPA autenticada para amizades e grupos: rota `/social` com abas Friends, Requests e Groups; detalhe do grupo em `/social/groups/:id`. Consome as APIs `/social/*` já existentes via `movieClient`, padrão de páginas como `MyMoviesPage` e `ConversationsListPage`.

## Requirements

### REQ-1: Acesso autenticado à área social

- **Dado que** o usuário está autenticado
- **Quando** navega para `/social`
- **Então** vê abas Friends, Requests e Groups
- **E** a aba Friends está selecionada por padrão

### REQ-2: Redirecionar visitante para login

- **Dado que** não há JWT válido no SPA
- **Quando** tenta abrir `/social` ou `/social/groups/3`
- **Então** é redirecionado para `/login?redirect=<caminho-original>`

### REQ-3: Listar amigos na aba Friends

- **Dado que** o usuário tem amigos aceitos
- **Quando** abre a aba Friends
- **Então** vê lista com `{ name, email }` de cada amigo
- **E** pode desfazer amizade com confirmação em dialog

### REQ-4: Buscar usuário e enviar solicitação

- **Dado que** o usuário está na aba Friends
- **Quando** informa `maria@example.com` e confirma envio
- **Então** chama `POST /social/friend-requests` com esse e-mail
- **E** exibe feedback de sucesso ou erro (toast)

### REQ-5: Solicitações de amizade na aba Requests

- **Dado que** há solicitações recebidas e enviadas pendentes
- **Quando** abre a aba Requests
- **Então** vê seção Incoming com aceitar/recusar por item
- **E** vê seção Outgoing com cancelar por item

### REQ-6: Convites de grupo na aba Requests

- **Dado que** há convites de grupo `pending` para o usuário
- **Quando** abre a aba Requests
- **Então** vê seção Group invites com `{ group.name, inviter.name }` por item
- **E** pode aceitar ou recusar cada convite

### REQ-7: Listar e criar grupos

- **Dado que** o usuário está na aba Groups
- **Quando** a página carrega
- **Então** lista grupos via `GET /social/groups` com `{ name, memberCount, joinedAt }`
- **E** pode criar grupo informando `name` e `description` opcional via `POST /social/groups`

### REQ-8: Detalhe do grupo

- **Dado que** o usuário clica em um grupo da lista
- **Quando** navega para `/social/groups/:id`
- **Então** carrega metadados do grupo a partir de `GET /social/groups` (filtra pelo `:id`)
- **E** exibe name, description, memberCount e se o usuário logado é dono
- **E** dono pode editar nome/descrição, convidar por e-mail, ver sugestões e excluir grupo
- **E** membro não-dono pode sair do grupo

### REQ-9: Convidar e sugerir no detalhe

- **Dado que** o usuário é membro do grupo aberto
- **Quando** informa e-mail no formulário de convite ou clica em amigo sugerido
- **Então** chama `POST /social/groups/:id/invites` com `{ email }`
- **E** lista sugestões via `GET /social/groups/:id/suggestions`

### REQ-10: Confirmação de ações destrutivas

- **Entrada** usuário clica desfazer amizade, sair do grupo ou excluir grupo
- **Saída** abre dialog de confirmação antes de chamar a API
- **Erro** cancelar no dialog → nenhuma chamada HTTP

### REQ-11: Link no header

- **Dado que** o usuário está autenticado
- **Quando** visualiza o header global
- **Então** vê link Social apontando para `/social`

### REQ-12: Tratamento de erro de API

- **Entrada** chamada social retorna 4xx/5xx ou falha de rede
- **Saída** toast genérico de erro  ||  lista/tela permanece utilizável
- **Erro** não exibe stack trace ao usuário

## Edge cases

- Abas vazias exibem mensagem específica (sem amigos, sem solicitações, sem grupos)
- Troca rápida de aba ignora resposta HTTP obsoleta (padrão `activeFetchIdRef` de `MyMoviesPage`)
- Grupo inexistente ou sem acesso em `/social/groups/:id` → mensagem not found e link de volta para `/social`
- Sem `GET /social/groups/:id` no backend  ||  detalhe monta a partir da listagem
- Sem endpoint de listar membros  ||  UI mostra `memberCount`, não lista nominal de membros nesta versão
- Erro 409 (grupo cheio, convite duplicado) → toast com mensagem derivada do status quando disponível

## Contratos expostos

- Cliente HTTP: reutilizar `packages/frontend/src/lib/api/movie-client.ts:movieClient` (Bearer + silent refresh)
- Backend amizades: `packages/backend/src/modules/social/infrastructure/http/controllers/routes.ts:socialControllers` (rotas `/social/friends*`, `/social/friend-requests*`, `/social/users/search`)
- Backend grupos: mesmas rotas (`/social/groups*`, `/social/group-invites*`)
- Rotas SPA: estender `packages/frontend/src/routes/index.tsx:routers` com `/social` e `/social/groups/:id`
- Header: `packages/frontend/src/layouts/Header.tsx:AuthActions`
