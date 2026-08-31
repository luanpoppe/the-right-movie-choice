# Memória do SDD

> Preferências e decisões recorrentes deste projeto. Mantida pelo `lp:continue`. Edite manualmente se quiser.

## Estilo / Processo

<!-- Como o agente deve trabalhar. Carrega SEMPRE. Não pré-supõe nada sobre features. -->

- Chaves de persistência no cliente usam nome de produto/domínio, não de bundler.
  - **Quando**: localStorage / sessionStorage
  - **Por quê**: o nome da ferramenta (Vite, etc.) não diz o que o usuário está salvando
  - **Exemplo**: tema da UI como `ui-theme` em vez de `vite-ui-theme`
  - **Registrado em**: 2026-08-21

- Parse de `Authorization: Bearer` fica num util do módulo auth (`AuthorizationHeaderUtils`), não copiado em cada hook.
  - **Quando**: extrair o access token do header HTTP
  - **Por quê**: o JWT é do auth; várias rotas podem precisar do mesmo parse
  - **Exemplo**: hook de recommendation de filme chama o util do auth
  - **Registrado em**: 2026-08-27

- Objeto passado para factory/`createX` se chama `Params`, não `Deps`. `DTO` fica para payload de API (body/query), não para injeção de colaboradores.
  - **Quando**: nomear o tipo do argumento de `create*` / factory
  - **Por quê**: `Deps` é jargão opaco; `DTO` sugere contrato HTTP
  - **Exemplo**: `MovieRecommendationAuthHookParams` em vez de `...HookDeps`
  - **Registrado em**: 2026-08-27

- Testes unitários ficam numa pasta `specs/` no mesmo nível da unidade testada, não como arquivo irmão `*.spec.ts` ao lado do código de produção.
  - **Quando**: criar ou mover testes unitários no backend
  - **Por quê**: separar o que o app executa do que só o Vitest lê
  - **Exemplo**: `application/specs/guest-quota.service.spec.ts` em vez de `application/guest-quota.service.spec.ts`
  - **Registrado em**: 2026-08-27

- Contrato que o SPA precisa ler não fica só em cookie httpOnly/Redis: expor header (ou equivalente) e CORS `exposedHeaders` (`@fastify/cors`).
  - **Quando**: cota/guest, qualquer dado server-only que a UI precise
  - **Por quê**: JavaScript não lê httpOnly nem Redis
  - **Exemplo**: `X-Guest-Remaining` no POST /movie/recommendation
  - **Registrado em**: 2026-08-27

- String vazia / ausente (`null`, `undefined`, `""`) vai para `StringUtils.isEmptyString`, não copiada em cada interceptor/hook.
  - **Quando**: checar token, cookie ou qualquer valor que precisa ser string não vazia
  - **Por quê**: o mesmo predicado aparecia no client de movies e no silent refresh
  - **Exemplo**: se `StringUtils.isEmptyString(accessToken)`, não envia Bearer
  - **Registrado em**: 2026-08-30

- Classe de regra de negócio (predicados, parse) não fica no arquivo da página; vai para `utils/` da feature.
  - **Quando**: extrair helper usado por um componente de página
  - **Por quê**: página fica só orquestração de estado; a regra fica testável e visível no domínio
  - **Exemplo**: `GuestChatLockUtils` em `features/movies/utils/guest-chat-lock.utils.ts`, não no final de `Home.tsx`
  - **Registrado em**: 2026-08-31

## Stack / Domínio

<!-- Decisões sobre tecnologia/arquitetura. Carrega, mas só para CONFIRMAR rápido — nunca substitui grill. -->

(vazio)
