# Tech grill — client TMDB v3
<!-- 2026-08-31 · branch feature/tmdb-client -->

## Escopo grelhado
Eixos cobertos: contrato HTTP debug, fronteiras (`modules/tmdb`), falhas (timeout/retry), validação Zod, performance (cache details), segurança (loopback + env), testes live, observabilidade, rollout do token.
Eixos descartados: schema de banco (não persiste filme); concorrência (GET sem mutação compartilhada além de cache Redis); rollback (revert de código + env, reversível); i18n de UI (locale já fixo no client).

## Decisões
### Contrato / API surface — GET search + GET details
- **Escolha:** dois GETs de debug (search com `page` default 1; details com `append_to_response` credits, watch/providers, external_ids). Rotas só com `NODE_ENV` `dev` ou `test`.
- **Alternativas descartadas:** um GET hidratado (acopla search+details); só search (não exercita details/cache).
- **Porquê:** espelha o fluxo oficial search → details; Postman consegue isolar cada chamada.
- **Custo aceito:** duas rotas para manter; não existem em `prod`.

### Segurança — guard de loopback na rota
- **Escolha:** recusar request cujo IP remoto não é loopback; **não** alterar `listen()` global do Fastify.
- **Alternativas descartadas:** JWT no debug (você preferiu não exigir auth); `listen` só 127.0.0.1 (quebra Docker/frontend em outro host); rota aberta em qualquer IP em `dev`.
- **Porquê:** `NODE_ENV=dev` em VPS sem guard vira proxy anônimo da TMDB.
- **Custo aceito:** Postman/testes precisam bater em localhost; túnel (ngrok) para o debug não é suportado.

### Rollout — token obrigatório fora de `test`
- **Escolha:** `TMDB_ACCESS_TOKEN` no Zod: obrigatório em `dev`/`prod`; em `test` pode ausentar.
- **Alternativas descartadas:** sempre obrigatório (CI unitária precisa dummy); opcional em prod (sobe mudo).
- **Porquê:** falha cedo onde a integração deve existir; unitário não depende de secret.
- **Custo aceito:** `.env` local e produção precisam da variável mesmo antes do chat usar TMDB.

### Falhas — timeout + 2 retries expo em 429/5xx
- **Escolha:** timeout explícito (constante no client) e até 2 retries com backoff exponencial só em 429 e 5xx.
- **Alternativas descartadas:** sem retry; retry em todo status; só `Retry-After`.
- **Porquê:** 429 da TMDB é o modo de contenção documentado; retry total multiplicaria abuso no debug.
- **Custo aceito:** latência no pior caso ≈ timeout × tentativas; 404/401 não retentam.

### Performance — cache Redis só de details, TTL 24h
- **Escolha:** Redis já usado no projeto; chave por `movie_id` + `language`; não cachear search.
- **Alternativas descartadas:** sem cache; cache de search; Map in-process; TTL 1h ou 7d.
- **Porquê:** ficha de filme muda pouco; search é aberto e stale é pior.
- **Custo aceito:** details “congelados” até 24h; testes do cache precisam fake/Redis.

### Validação — Zod → DTO nosso
- **Escolha:** adapter parseia resposta TMDB com Zod e mapeia para DTO interno (não vaza o JSON cru).
- **Alternativas descartadas:** passthrough; strip com campos extras da TMDB no contrato.
- **Porquê:** quebra de schema vira erro de domínio (`BaseException`), não 500 opaco; troca de vendor depois é no mapper.
- **Custo aceito:** campos que a TMDB adicionar não aparecem até o schema evoluir.

### Observabilidade — log estruturado sem segredo
- **Escolha:** `Logger` com método TMDB, status HTTP, latency, `movieId`/query resumida; nunca Bearer nem body completo.
- **Alternativas descartadas:** só erro; log do body.
- **Porquê:** debug 3am sem vazar token nem payload enorme.
- **Custo aceito:** query string pode ser PII fraca (gosto de filme); manter curto.

### Testes — live nunca na CI
- **Escolha:** suite live opt-in só local explícito; job `pnpm test` / CI **não** dispara live. Unitário com HTTP fake.
- **Alternativas descartadas:** live se houver token (CI quebra ou bate TMDB sem querer); flag+token na CI.
- **Porquê:** CI sem secret e sem flake de rede.
- **Custo aceito:** regressão de contrato real da TMDB não é pega no pipeline.

### Fronteiras — porta em `domains/movies`, transporte em `src/modules/tmdb`
- **Escolha:** `IMovieCatalogProvider` junto das outras portas de filmes. Adapter HTTP, cache e rotas debug ficam em `modules/tmdb`. `domains/movies` / LangChain não importam o client TMDB nesta mudança.
- **Alternativas descartadas:** porta dentro de `modules/tmdb`; adapter TMDB em `domains/movies` ao lado do LangChain; `src/lib/tmdb` sem porta de domínio.
- **Porquê:** tools do agente vêm depois; o client precisa ser testável e substituível.
- **Custo aceito:** mais uma pasta `modules/`.

## Riscos abertos / a revisitar
- Guard de IP em reverse proxy (Fastify pode ver IP do proxy, não do cliente) — gatilho: colocar o backend atrás de nginx em `dev`.
- Cache 24h vs ficha recém-atualizada na TMDB — gatilho: tools do chat no ar e usuário reclamando de runtime/providers velhos.
- Retry × endpoint debug em loop no Postman — gatilho: abuso ou 429 em cadeia.
- Live tests só locais — gatilho: mudança de contrato TMDB sem ninguém rodar a suite.

## Perguntas não resolvidas
- Valor numérico exato do timeout e da base do backoff (constantes na spec da feature `tmdb-http-client`).
- Forma da chave Redis (`tmdb:movie:{id}:{lang}` vs outra) — spec de `tmdb-movie-queries`.
