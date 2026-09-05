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

- String vazia / ausente (`null`, `undefined`, `""`) vai para `StringUtils.isEmptyString`, não copiada em cada interceptor/hook/env.
  - **Quando**: checar token, cookie, env var ou qualquer valor que precisa ser string não vazia
  - **Por quê**: o mesmo predicado aparecia no client de movies e no silent refresh
  - **Exemplo**: `env.ts` usa `StringUtils.isEmptyString` no `superRefine` do token TMDB; no SPA, se vazio não envia Bearer
  - **Registrado em**: 2026-09-01

- Classe de regra de negócio (predicados, parse) não fica no arquivo da página; vai para `utils/` da feature.
  - **Quando**: extrair helper usado por um componente de página
  - **Por quê**: página fica só orquestração de estado; a regra fica testável e visível no domínio
  - **Exemplo**: `GuestChatLockUtils` em `features/movies/utils/guest-chat-lock.utils.ts`, não no final de `Home.tsx`
  - **Registrado em**: 2026-08-31

- Espera assíncrona (`setTimeout` + Promise) vai para `DelayUtils.delay` em `shared/utils`, não copiada no módulo.
  - **Quando**: backoff, retry, qualquer `sleep` no backend
  - **Por quê**: o mesmo Promise/setTimeout não é regra de TMDB
  - **Exemplo**: `TmdbHttpClient` usa `params.delay ?? DelayUtils.delay`
  - **Registrado em**: 2026-09-02

- Biblioteca que já é facade não ganha wrapper/singleton no app; o call site instancia direto (`new AI()`).
  - **Quando**: integrar pacote próprio de LLM/HTTP que já unifica vendors
  - **Por quê**: o wrapper só duplica tipos e esconde a API real
  - **Exemplo**: `@luanpoppe/ai` no backend de recomendações — sem `AiClient`
  - **Registrado em**: 2026-09-03

- Troca de vendor/runtime não funde passos de pipeline (JSON + texto, etc.) se isso exige mudar use case ou porta; anotar follow-up e manter as duas chamadas.
  - **Quando**: migrar adapter sem redesenhar o fluxo do domínio
  - **Por quê**: misturar simplificação de contrato com troca de lib infla o diff e o risco
  - **Exemplo**: recommendation continua `getStructuredMoviesRecommendation` + `getChatResponse` nesta mudança
  - **Registrado em**: 2026-09-03

- Config de construtor com campos opcionais (omitir vazio, não passar `undefined`) sai do `create()` para um método privado estático da factory.
  - **Quando**: montar `new AI()` / cliente HTTP no bootstrap
  - **Por quê**: o `create()` fica só orquestração; a regra de chaves fica nomeada e reutilizável no arquivo
  - **Exemplo**: `MakeGetMovieRecommendationUseCaseFactory.buildAiConfig`
  - **Registrado em**: 2026-09-04

- Com `memory`/`checkpointer` no `AI`, a persistência do turno é o `invoke` (`threadId` obrigatório). Não gravar de novo no Redis JSON/`addMessage`.
  - **Quando**: histórico de chat via `@luanpoppe/ai`
  - **Por quê**: dual-write duplica estado; a lib já salva o checkpoint na call
  - **Exemplo**: recommendation passa `threadId: chatId` e `messages` só do turno atual
  - **Registrado em**: 2026-09-04

## Stack / Domínio

<!-- Decisões sobre tecnologia/arquitetura. Carrega, mas só para CONFIRMAR rápido — nunca substitui grill. -->

- Integração HTTP de terceiro: porta no módulo **pelo domínio** (métodos de operação), não `getJson(path)` genérico; adapter valida/transporta; secret só em env.
  - **Quando**: novo vendor (catálogo, pagamento, etc.)
  - **Exemplo**: `IMovieCatalogProvider.searchMovies` / `getMovieDetails`, não `ITmdbHttpClient.getJson`
  - **Registrado em**: 2026-09-01

- Tool de agente que consulta vendor não relança falha HTTP: devolve miss estruturado para o modelo seguir com o que já sabe.
  - **Quando**: LLM com tool sobre API de terceiro
  - **Por quê**: derrubar o turno inteiro impede a resposta conversacional
  - **Exemplo**: lookup TMDB captura `TmdbHttpException` e devolve `{ found: false }`
  - **Registrado em**: 2026-09-05

- Várias buscas de catálogo no mesmo turno da IA: Zod de **array** + `Promise.all` no adapter da tool; o domínio continua `lookup` unitário.
  - **Quando**: o modelo precisa enriquecer vários candidatos de uma vez
  - **Por quê**: uma function call, paralelismo no Node, contrato de F1 intacto
  - **Exemplo**: `{ queries: [{ query, year? }] }` → array de `MovieCatalogLookupResult` na mesma ordem
  - **Registrado em**: 2026-09-05

- “Tool” no código só é o que o agente de IA chama (`AITools.createTool` / function calling). Orquestração de catálogo/HTTP fica serviço/provider, não `*Tool`.
  - **Quando**: ligar LLM a vendor
  - **Por quê**: o nome Tool no domínio sugere function call; o modelo só vê o adapter Zod
  - **Exemplo**: `lookupMovies` via `MovieCatalogLookupAiTool`; `MovieCatalogLookupService.findDetailsByTitle` é o serviço de catálogo
  - **Registrado em**: 2026-09-05

- Teste que chama API real não entra no job unitário da CI; opt-in só local.
  - **Quando**: client de serviço externo
  - **Exemplo**: live TMDB fora do `pnpm test` da CI
  - **Registrado em**: 2026-08-31

- Ficha no Postgres é “fresca” por 30 dias (`updatedAt`); depois o lookup pode ir ao TMDB. Redis (24h) ainda vence enquanto o TTL não acaba. Persistência no banco no miss é fila (não upsert síncrono no lookup).
  - **Quando**: lookup local-first do catálogo
  - **Por quê**: dado local sem refetch contínuo; o agente não espera o save no Postgres
  - **Exemplo**: Interestelar gravado há 3 dias não chama TMDB; há 31 dias refetch; miss TMDB só `TmdbMovieDetailsCache.set` até o worker
  - **Registrado em**: 2026-09-05

- Adapter Prisma com várias classes `MovieCatalog*` vai para subpasta `repositories/movie-catalog/`, um arquivo por classe.
  - **Quando**: o repositório passar de ~200 linhas ou tiver 3+ helpers estáticos
  - **Por quê**: prefixo repetido no nome já é o nome da pasta; o arquivo único vira god object
  - **Exemplo**: `PrismaMovieCatalogRepository` + builders/writer separados
  - **Registrado em**: 2026-09-05

- Mensagem de erro para log (`unknown` → string) vai para `ErrorUtils.message` em `shared/utils`, não copiada em cada classe.
  - **Quando**: extrair `reason`/`errorMessage` de `catch (error: unknown)`
  - **Por quê**: o mesmo `instanceof Error` + `String(error)` aparecia em processor, resolver e lookup
  - **Exemplo**: `ErrorUtils.message(error)` no log de falha do `CatalogPersistProcessor`
  - **Registrado em**: 2026-09-05
