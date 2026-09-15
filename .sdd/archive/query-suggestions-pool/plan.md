# Pool persistido de sugestões de busca na landing

> **id**: `query-suggestions-pool` · **criada**: 2026-09-14 · **idioma**: pt-BR

## Contexto

Hoje `GET /movie/queries` chama a IA em cada visita à landing para gerar 3 chips de sugestão — custo, latência e variabilidade descontrolada. Esta mudança mantém um pool fixo de 100 textos únicos no Postgres, exibe 3 aleatórios por visita e renova o pool semanalmente (5 novos substituem os 5 mais antigos), com seed inicial idempotente via IA.

## Decisões macro

- **Pool de 100 itens**: tamanho fixo em constante nomeada (`POOL_SIZE = 100`). **Por quê**: equilíbrio entre variedade e custo de manutenção. **Alternativa descartada**: pool ilimitado (crescimento sem controle).
- **Rotação semanal +5/−5**: cron in-process (`node-cron`) remove os 5 registros mais antigos (`createdAt`) e insere 5 novos. **Por quê**: renovação gradual sem zerar o pool. **Alternativa descartada**: CLI externa apenas (mais ops em deploy).
- **3 chips aleatórios por visita**: contrato HTTP inalterado (`queries.length === 3`); frontend não muda. **Por quê**: UX atual preservada; ganho é no backend.
- **Seed idempotente em 4 chamadas × 25 itens**: script dedicado (ex. `pnpm seed:query-suggestions`); pula se o pool já tem 100. **Por quê**: menos round-trips que gerar de 3 em 3. **Alternativa descartada**: migration SQL com textos estáticos.
- **Unicidade**: `UNIQUE` no texto + prompt informa existentes + retry em colisão. **Por quê**: dedup confiável sem depender só da IA.
- **Fallback IA se pool vazio**: comportamento atual temporário até o seed rodar. **Por quê**: landing não quebra em ambiente novo.
- **Reuso de prompts/schema**: adaptar `MovieQueryExamplesPrompts` e `MovieQueryExamplesSchema` para count variável (25 no seed, 5 no cron, 3 no fallback). **Por quê**: consistência de tom e critérios já validados.

## Features (executadas sequencialmente)

1. **pool-persistence-seed** — Modelo Prisma, repositório e script de seed idempotente (4×25 via IA) para popular o pool de 100 sugestões únicas.
2. **pool-read-api** — `GET /movie/queries` lê 3 sugestões aleatórias do pool; fallback para IA se o pool estiver vazio.
3. **pool-weekly-rotation** — Cron in-process semanal: gera 5 novas sugestões via IA e remove as 5 mais antigas.

## Escopo

**Dentro**: tabela + repositório; seed CLI idempotente; leitura aleatória no endpoint existente; job semanal in-process; constantes de tamanho (100/5/3/25); adaptação de prompts/schema para batch variável; logs no fluxo novo.

**Fora**: mudar quantidade de chips na landing; rastrear exibições por usuário; validar sugestões no TMDB antes de salvar; alterar fluxo de recommendation/chat; mudanças no frontend (`InputSuggestions`).
