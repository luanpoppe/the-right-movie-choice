# The Right Movie Choice

[![Status do Projeto](https://img.shields.io/badge/status-ativo-success.svg)]()
[![Linguagem](https://img.shields.io/badge/linguagem-TypeScript-blue.svg)]()

Plataforma de recomendação de filmes com **API** (Node.js + Fastify) e **interface web** (React + Vite). O backend usa IA generativa via **OpenRouter** (primário) e **Google Gemini** (fallback opcional), segue **Clean Architecture** e **SOLID**; o frontend consome a API para chat e exibição das sugestões.

O repositório é um **monorepo pnpm**:

```
packages/
  backend/   # API Fastify (@the-right-movie-choice/backend)
  frontend/  # App React + Vite (@the-right-movie-choice/frontend)
```

## Spec-driven development (`lp:*`)

Mudanças neste projeto (features, bug-fixes, revisões) são conduzidas com o **SDD `lp:*`**, um spec-driven development criado para este fluxo de trabalho. Artefatos ficam em `.sdd/` (config, memória, contexto do domínio, mudanças ativas e arquivo).

O toolkit público está em [luanpoppe/sdd](https://github.com/luanpoppe/sdd). Skills principais: `/lp-new`, `/lp-continue`, `/lp-bug-fix`, `/lp-review`, `/lp-status`.

## Em Produção (Versão Inicial)

A API está disponível em uma instância gratuita da **Oracle Cloud**, com **PM2** e **Redis** via **Docker**. O PostgreSQL do módulo de usuários é usado no ambiente local; o deploy em produção ainda não inclui esse banco.

**Swagger (produção):** [http://164.152.61.119:8080/swagger](http://164.152.61.119:8080/swagger)

## Features Principais

### Backend

- **Recomendações via IA:** Sugestões baseadas em linguagem natural; cada resposta retorna até **3 filmes** com título, diretor, elenco, ano, nota IMDb, duração, sinopse, plataforma de streaming e motivo da sugestão. Quando o agente resolve o catálogo via **`lookupMovies`**, cada filme pode incluir **`tmdbId`** e **`imdbId`** opcionais para o SPA marcar listas.
- **Catálogo local (Postgres):** Fichas `Movie` + filhas persistidas via Prisma; lookup **local-first** (Redis → banco → TMDB) no agente e no `GET /debug/tmdb/movies/:id`; persistência assíncrona no miss TMDB via fila **BullMQ** (`catalog-movie-persist`).
- **Sugestões de busca via IA:** `GET /movie/queries` gera exemplos criativos de prompts para iniciar uma conversa.
- **Histórico de conversa:** Contexto por sessão no Redis, identificado pelo header `chatid`.
- **Saída estruturada:** JSON validado com **Zod** (entrada, saída e documentação Swagger).
- **Respostas conversacionais:** Texto amigável além dos dados dos filmes.
- **Rotas públicas de filmes:** Recomendações e sugestões de busca não exigem login; convidados têm **cota anônima** (header `X-Guest-Remaining`). `Authorization: Bearer` opcional na recomendação pula a cota.
- **Listas do usuário:** `GET`/`PATCH /movie/user-entries` exigem **JWT** (`Authorization: Bearer`). Uma linha por `(userId, tmdbId)` com flags `watched`, `favorite`, `inWatchlist` e metadados opcionais de assistido (`rating` 1–10, `watchedAt`). Listagens aceitam filtros por flag e podem enriquecer com resumo do catálogo (`title`, `year`, `posterPath` como URL TMDB).
- **Usuários e autenticação:** Módulo `users` (cadastro com **Prisma** + **bcrypt**) e módulo `auth` com **JWT** de curta duração no body, **refresh token** httpOnly no **Redis** (rotação a cada refresh), logout que revoga o refresh e **login/cadastro com Google** (conta unificada por e-mail). Emissão de sessão centralizada em `AuthSessionFacade`.
- **Logging estruturado:** **Pino** (`lib/logger`) nos fluxos de auth e cadastro.
- **CORS:** `@fastify/cors` com `credentials: true` para `localhost` e deploys `*.vercel.app`; expõe `X-Guest-Remaining`.
- **Arquitetura desacoplada:** Clean Architecture no pacote `packages/backend`.
- **Testes:** **Vitest** para casos de uso, providers e mappers.
- **Documentação:** Swagger gerado a partir dos schemas Zod via `fastify-type-provider-zod`.

### Frontend

- **Interface de chat** para pedir recomendações e ver filmes sugeridos.
- **Ações nos cards:** marcar assistido (nota/data opcionais), favorito e watchlist com PATCH otimista.
- **Biblioteca `/my-movies`:** abas Assistidos, Quero ver e Favoritos; link no header quando autenticado.
- **Tema claro/escuro**, componentes com Radix UI e Tailwind CSS.
- **Integração com a API** via variáveis `VITE_*` (ver `packages/frontend/.env.example`).
- **Autenticação:** telas `/login` e `/register` com senha ou botão Google (`@react-oauth/google`).

## Próximos Passos

- **Listas personalizadas** (nomeadas pelo usuário, novas tabelas)
- **Filtrar recomendações** por filmes já assistidos

## 🏛️ Análise Arquitetural do Backend

O backend do projeto é uma implementação prática da **Clean Architecture**, uma abordagem que organiza o software em camadas concêntricas. O princípio fundamental é a **Regra de Dependência**, que dita que as dependências do código devem apontar sempre para dentro, das camadas externas (detalhes de tecnologia) para as camadas internas (regras de negócio).

Isso significa que a camada de **Infrastructure** (onde residem frameworks e drivers de banco de dados) depende da camada de **Application** (que orquestra os casos de uso), que por sua vez depende da camada de **Domain** (o núcleo com as regras de negócio puras). Essa estrutura garante que a lógica de negócio permaneça isolada e independente de detalhes de implementação, como o banco de dados ou a API da web, tornando o sistema mais testável, flexível e fácil de manter.

### Estrutura e Princípios SOLID

A lógica da API fica em `packages/backend/src`, organizada da seguinte forma:

- **`domains/...` (ex.: filmes):** Bounded contexts legados em `src/domains/movies`, com `domain`, `application` e `infrastructure`.

- **`modules/...` (ex.: `users`, `auth`):** Contextos em `src/modules/*`, mesma separação de camadas. O domínio inclui entidades, exceções e **ports** (ex.: `IUserRepository`, `IRefreshTokenRepository`).

- **`domain` (Camada de Domínio):** Entidades (ex.: `UserEntity`, `MovieRecommendationEntity`), exceções de negócio e contratos de persistência, sem dependências externas.

- **`application` (Camada de Aplicação):** Orquestra fluxos via **use cases** (ex.: `GetMovieRecommendationUseCase`, `GetMoviesQueryExamplesUseCase`, `CreateUserUseCase`, `LoginUseCase`). Depende de abstrações do domínio, não de Prisma ou Redis diretamente (**DIP**).

- **`infrastructure` (Camada de Infraestrutura):** Adapters concretos (`PrismaUserRepository`, `ChatHistoryAiMemoryRepository` / checkpointer Redis), **mappers**, **factories** de composição e, onde aplicável, HTTP (controllers, DTOs, rotas Fastify).

- **`core`:** Abstrações compartilhadas entre contextos (`BaseException`, `IChatHistoryRepository`).

- **`shared`:** Utilitários e constantes transversais (ex.: `PrismaUtil`, `BCRYPT_SALT_ROUNDS`).

- **`lib`:** Clientes e utilitários técnicos (`lib/prisma`, `lib/redis`, `lib/ai`, `lib/logger`).

A aplicação de cada classe a uma única responsabilidade (ex: um repositório apenas persiste dados, um caso de uso apenas orquestra um fluxo) garante o **Princípio da Responsabilidade Única (SRP)**.

### Bootstrap HTTP (`src/app.ts`)

- Validação e serialização com **fastify-type-provider-zod**.
- **Cookies** assinados (`@fastify/cookie`) para o refresh token.
- **CORS** com headers permitidos: `Content-Type`, `Authorization`, `chatId`.
- **Error handler** global: `BaseException`, erros Zod, violações de unique do Prisma (`409`) e mensagem genérica em produção.

## 🛠️ Tecnologias Utilizadas

O projeto agora é um monorepo gerenciado com **pnpm workspaces**. As tecnologias foram divididas entre as frentes:

**Backend:**
- **Runtime:** Node.js
- **Linguagem:** TypeScript
- **Framework Web:** Fastify
- **Validação / OpenAPI:** Zod + `fastify-type-provider-zod`
- **Testes:** Vitest
- **IA generativa:** `@luanpoppe/ai` via OpenRouter (primário) e Gemini (fallback opcional); memória de chat com `@langchain/langgraph-checkpoint-redis`
- **ORM:** Prisma 7 (driver adapter `@prisma/adapter-pg`)
- **Banco de dados:** PostgreSQL (usuários + catálogo `Movie`) + Redis (histórico de chat, refresh tokens, cache TMDB details e cota de convidado, `ioredis`)
- **Senhas:** bcrypt
- **Auth:** JWT (`jose`) + refresh em Redis + cookies (`@fastify/cookie`) + Google ID token (`google-auth-library`)
- **HTTP:** `@fastify/cors`
- **Logging:** Pino
- **Documentação da API:** `@fastify/swagger` + `@fastify/swagger-ui`
- **Variáveis de ambiente:** Dotenv (validadas em `src/env.ts`)
- **Execução em TS:** `tsx`
- **Gerenciador de processos (prod):** PM2

**Frontend:**
- **Framework UI:** React
- **Linguagem:** TypeScript
- **Bundler:** Vite
- **Estilização:** Tailwind CSS
- **Componentes:** Radix UI
- **Requisições:** Axios
- **Validação:** Zod

## Documentação da API (Swagger)

**Local:** `http://localhost:3333/swagger` (porta padrão de `PORT` em `packages/backend/.env`; ajuste se alterar o `.env`).

A documentação é gerada a partir dos mesmos schemas **Zod** usados na validação das requisições.

## Como Executar Localmente

### Pré-requisitos

- Node.js (v20.19+ recomendado para Prisma 7; mínimo v18+)
- [pnpm](https://pnpm.io/) (v10+; o projeto fixa `pnpm@10.20.0` via `packageManager`)
- Docker e Docker Compose (Redis e PostgreSQL)

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/luanpoppe/the-right-movie-choice-full.git
   cd the-right-movie-choice-full
   ```

2. **Instale as dependências (raiz):**
   ```bash
   pnpm install
   ```

3. **Variáveis de ambiente:**
   ```bash
   cp packages/backend/.env.example packages/backend/.env
   cp packages/frontend/.env.example packages/frontend/.env
   ```
   No backend, preencha as variáveis abaixo (ver `packages/backend/.env.example`). A porta em `DATABASE_URL` deve coincidir com `POSTGRES_PORT`; em `REDIS_URL`, use a mesma porta de `REDIS_PORT` (padrão Docker: `localhost:6379`). No frontend, `VITE_BACKEND_URL` deve apontar para a mesma porta da API (`http://localhost:3333` por padrão) e `VITE_GOOGLE_CLIENT_ID` deve ser o **mesmo Client ID** do backend.

   | Variável | Descrição |
   |----------|-----------|
   | `NODE_ENV` | `dev`, `prod` ou `test` |
   | `PORT` | Porta HTTP da API (padrão: `3333`) |
   | `DATABASE_URL` | Connection string PostgreSQL |
   | `REDIS_URL` | Host:porta do Redis, sem protocolo (ex.: `localhost:6379`). O `ioredis` usa assim; a factory prefixa `redis://` só para o checkpointer LangGraph. |
   | `OPENROUTER_API_KEY` | Chave OpenRouter (obrigatória fora de `test`) |
   | `GEMINI_API_KEY` | Chave Google Gemini (opcional; vazia = sem fallback) |
   | `JWT_SECRET` | Segredo para assinar access tokens |
   | `JWT_ACCESS_EXPIRES_IN` | TTL do access token (padrão: `15m`) |
   | `REFRESH_TOKEN_TTL_SECONDS` | TTL do refresh no Redis (padrão: `604800` = 7 dias) |
   | `REFRESH_COOKIE_NAME` | Nome do cookie httpOnly (padrão: `refreshToken`) |
   | `COOKIE_SECRET` | Segredo para assinar cookies |
   | `GOOGLE_CLIENT_ID` | Client ID OAuth 2.0 do Google |
   | `TMDB_ACCESS_TOKEN` | Bearer token da API TMDB v3 (obrigatório fora de `test`) |

   **Google Cloud Console (OAuth):**
   1. Crie credenciais **OAuth 2.0** do tipo **Aplicativo da Web**.
   2. Em **Origens JavaScript autorizadas**, adicione `http://localhost:3009` (e a URL do frontend em produção).
   3. Copie o **Client ID** para `GOOGLE_CLIENT_ID` (backend) e `VITE_GOOGLE_CLIENT_ID` (frontend).
   4. Não é necessário configurar URI de redirecionamento para o fluxo GIS + ID token usado pelo app.

4. **Infraestrutura (Redis + PostgreSQL):**
   ```bash
   cd packages/backend
   docker compose up -d
   cd ../..
   ```

5. **Banco de dados (Prisma)** — após configurar o `.env`:
   ```bash
   cd packages/backend
   pnpm db:generate
   pnpm db:migrate
   ```
   `db:generate` gera o client em `packages/backend/generated/prisma`. `db:migrate` cria/atualiza as tabelas (`User`, `UserMovieEntry`, `Movie` e filhas do catálogo).

6. **Subir backend e frontend juntos (recomendado):**
   ```bash
   pnpm dev
   ```
   - API: `http://localhost:3333` (porta configurável via `PORT` em `packages/backend/.env`)
   - UI: `http://localhost:3009` (Vite)

### Comandos na raiz

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Backend + frontend em paralelo (mesmo terminal) |
| `pnpm start` | Apenas backend (watch) |
| `pnpm start:frontend` | Apenas frontend (Vite) |
| `pnpm build` | Build de produção do frontend |
| `pnpm lint` | ESLint no frontend |
| `pnpm test` | Testes unitários do backend |

Comandos também podem ser executados dentro de `packages/backend` ou `packages/frontend`.

### Comandos do backend (`packages/backend`)

| Comando | Descrição |
|---------|-----------|
| `pnpm db:generate` | Gera o Prisma Client |
| `pnpm db:migrate` | Aplica migrations em desenvolvimento |
| `pnpm db:studio` | Abre o Prisma Studio |
| `pnpm test:catalog-lookup-bench` | Benchmark opt-in: batch vs unitário com Postgres + Redis reais |
| `pnpm test:tmdb-live` | Teste live opt-in contra a API TMDB (fora do `pnpm test` da CI) |

### Postman

Coleção e environments em [`packages/backend/postman`](packages/backend/postman). Importe a coleção e o environment **Local** (`baseUrl` padrão `http://localhost:3333`, alinhado ao `.env.example`). O Postman guarda cookies `refreshToken` (auth) e `guest-id` (cota de convidado) via Cookie Jar. Variável `userEntryTmdbId` (padrão `27205`) alimenta as rotas `/movie/user-entries/:tmdbId`.

Pastas: **Movies** (recomendação convidado/Bearer), **User movie entries** (JWT obrigatório), **Users**, **Auth**, **TMDB debug** (somente `NODE_ENV !== prod`, loopback).
## Referência da API

`POST /movie/recommendation` e `GET /movie/queries` são **públicas**. `GET`/`PATCH /movie/user-entries` exigem **`Authorization: Bearer`**. Cadastro e login (`/users/register`, `/auth/login`, `/auth/google`) também não exigem Bearer nas rotas de auth. Refresh e logout dependem do cookie httpOnly `refreshToken`.

> Nos exemplos locais, a porta padrão é `3333` (`PORT` no `.env`). Headers HTTP são case-insensitive; o backend valida o campo `chatid` (o cliente pode enviar `chatId`).

### `POST /movie/recommendation`

- **Header obrigatório:** `chatid` (string) — ID da sessão de conversa no Redis.
- **Header opcional:** `Authorization: Bearer <accessToken>` — usuário logado; pula a cota de convidado.
- **Convidado (sem Bearer):** cookie `guest-id` (httpOnly) + header de resposta `X-Guest-Remaining` com tentativas restantes.
- **Body:**
  ```json
  {
    "userMessage": "Quero um filme de comédia leve para relaxar."
  }
  ```
- **Resposta `200`:**
  ```json
  {
    "response": "Texto conversacional da IA.",
    "movies": [
      {
        "title": "string",
        "director": "string",
        "actors": ["string"],
        "releaseYear": 2010,
        "streamingPlatform": "string",
        "imdbRating": 8.5,
        "synopsis": "string",
        "whySuggestion": "string",
        "durationInMinutes": 120,
        "tmdbId": 27205,
        "imdbId": "tt1375666",
        "posterPath": "https://image.tmdb.org/t/p/w500/..."
      }
    ]
  }
  ```
  `tmdbId` e `imdbId` são **opcionais** — presentes quando o agente resolve o filme no catálogo via `lookupMovies`; omitidos quando o título não foi encontrado. `posterPath` é **sempre** retornado (`null` quando não há capa no catálogo); quando presente, é URL completa TMDB.

**Exemplo (produção):**
```bash
curl --location 'http://164.152.61.119:8080/movie/recommendation' \
  --header 'chatid: minha-sessao-xyz-789' \
  --header 'Content-Type: application/json' \
  --data '{"userMessage": "Sugira um filme de ficção científica com uma boa história."}'
```

**Respostas:** `200`, `400` (validação / header ausente), `500` (erro interno / schema da IA).

### `GET /movie/queries`

- **Autenticação:** não requerida.
- **Resposta `200`:**
  ```json
  {
    "queries": [
      { "queryExample": "Um thriller psicológico para assistir sozinho à noite" }
    ]
  }
  ```

**Exemplo (local):**
```bash
curl http://localhost:3333/movie/queries
```

**Respostas:** `200`, `500` (erro interno / schema da IA).

### `GET /movie/user-entries`

- **Autenticação:** `Authorization: Bearer <accessToken>` (obrigatório).
- **Query opcional:** `watched`, `favorite`, `inWatchlist` — boolean (`true`/`false` ou string `"true"`/`"false"`).
- **Resposta `200`:**
  ```json
  {
    "entries": [
      {
        "tmdbId": 27205,
        "movieId": 1,
        "watched": true,
        "favorite": false,
        "inWatchlist": false,
        "rating": 9,
        "watchedAt": "2026-09-01T00:00:00.000Z",
        "createdAt": "2026-09-01T12:00:00.000Z",
        "updatedAt": "2026-09-01T12:00:00.000Z",
        "movie": {
          "title": "A Origem",
          "year": 2010,
          "posterPath": "https://image.tmdb.org/t/p/w500/..."
        }
      }
    ]
  }
  ```
  `movie` é `null` quando o filme ainda não está no catálogo local; `posterPath` é URL completa TMDB quando disponível.

**Exemplo (local):**
```bash
curl "http://localhost:3333/movie/user-entries?watched=true" \
  -H "Authorization: Bearer <accessToken>"
```

**Respostas:** `200`, `400`, `401`.

### `GET /movie/user-entries/:tmdbId`

- **Autenticação:** Bearer obrigatório.
- **Path:** `tmdbId` — inteiro positivo.
- **Resposta `200`:** `{ "entry": { ... } }` (mesmo formato de um item da listagem).
- **Respostas:** `200`, `400`, `401`, `404` (entrada inexistente para o usuário).

### `PATCH /movie/user-entries/:tmdbId`

- **Autenticação:** Bearer obrigatório.
- **Path:** `tmdbId` — inteiro positivo.
- **Body** (pelo menos um campo; `strict`):
  ```json
  {
    "watched": true,
    "favorite": true,
    "inWatchlist": false,
    "rating": 8,
    "watchedAt": "2026-09-01T00:00:00.000Z"
  }
  ```
  `rating` aceita `null` para limpar; `watchedAt` aceita `null` ou ISO datetime.
- **Resposta `200`:** `{ "entry": { ... } | null }` — `entry` é `null` quando todas as flags ficam falsas (linha removida).

**Exemplo (local):**
```bash
curl -X PATCH "http://localhost:3333/movie/user-entries/27205" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d "{\"favorite\": true}"
```

**Respostas:** `200`, `400`, `401`.

### `POST /users/register`

- **Body:**
  ```json
  {
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "password": "senha12345"
  }
  ```
  A senha deve ter no mínimo 8 caracteres.

**Exemplo (local):**
```bash
curl -X POST http://localhost:3333/users/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"usuario@example.com\",\"name\":\"Nome\",\"password\":\"senha12345\"}"
```

**Respostas:** `201` (usuário criado, sem `passwordHash`), `400` (validação), `409` (e-mail já cadastrado com senha). Se o e-mail existir apenas via Google, o cadastro nativo **define a senha** na mesma conta.

> Em produção, este endpoint ainda não está disponível (PostgreSQL local apenas).

### `POST /auth/google`

- **Body:** `{ "idToken": "<JWT do Google Identity Services>" }`
- **Resposta `200`:** igual ao login (`accessToken` + cookie `refreshToken`)
- **Comportamento:** cria conta Google-only, ou vincula `googleId` a usuário nativo com o mesmo e-mail
- **Respostas:** `401` (token inválido ou e-mail não verificado), `409` (conta já vinculada a outro Google)

> O `idToken` é obtido no browser (botão Google no frontend ou DevTools). Testar via curl exige colar um token válido de curta duração.

### `POST /auth/login`

- **Body:** `{ "email", "password" }`
- **Resposta `200`:** `{ "accessToken", "expiresIn", "tokenType": "Bearer" }` + cookie httpOnly `refreshToken`
- **Respostas:** `401` credenciais inválidas

**Exemplo (local, salvar cookie em arquivo):**
```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{\"email\":\"usuario@example.com\",\"password\":\"senha12345\"}"
```

### `POST /auth/refresh`

- **Cookie:** `refreshToken` (enviado automaticamente pelo navegador/Postman)
- **Resposta `200`:** novo access token no body + novo cookie de refresh (rotação)
- **Respostas:** `401` refresh inválido ou ausente

```bash
curl -X POST http://localhost:3333/auth/refresh -b cookies.txt -c cookies.txt
```

### `POST /auth/logout`

- **Cookie:** `refreshToken`
- **Resposta:** `204` (revoga no Redis e limpa o cookie)

```bash
curl -X POST http://localhost:3333/auth/logout -b cookies.txt
```

### `GET /debug/tmdb/search` (somente dev, loopback)

- **Autenticação:** não requerida; rota registrada apenas com `NODE_ENV !== prod`. Origem deve ser loopback (`127.0.0.1` / `::1`).
- **Query:** `query` (obrigatório), `page` (opcional), `language` (opcional, ex. `pt-BR`).

```bash
curl "http://localhost:3333/debug/tmdb/search?query=matrix&page=1"
```

### `GET /debug/tmdb/movies/:id` (somente dev, loopback)

- **Autenticação:** não requerida; mesmas restrições de ambiente e loopback acima.
- **Path:** `id` — `tmdbId` inteiro.
- **Query:** `language` (opcional; omitido → `pt-BR` no resolver).
- **Comportamento:** lookup local-first (Redis → Postgres fresco → TMDB); miss TMDB enfileira persistência no Postgres.

```bash
curl "http://localhost:3333/debug/tmdb/movies/603?language=pt-BR"
```

## Testes

```bash
pnpm test
```

Roda os testes unitários do pacote `packages/backend` (projeto Vitest `unit`). Atualmente **442** testes cobrindo filmes (recomendação, catálogo, lookup em lote, listas do usuário), auth, users, TMDB e mappers Prisma.

### Lookup em lote no catálogo (`lookupMovies`)

A tool do agente `lookupMovies` resolve até 8 títulos por turno em **duas fases**:

1. **Batch local** — no máximo 1 SQL de ids (`VALUES` + `ROW_NUMBER` por posição, `rn = 1`) + 1 `findMany` com filhas no Postgres; aquecimento Redis via `MGET`/`pipeline SET` em lote nos hits frescos (< 30 dias).
2. **TMDB paralelo** — só nos misses/stale: `findDetailsByTitle` em `Promise.all` (comportamento equivalente ao fluxo anterior).

Com 8 filmes já no banco, isso reduz de ~16 round-trips Postgres + ~8 Redis para ~2 Postgres + 1 Redis (leitura/escrita em lote), sem chamar a TMDB.

**Benchmark de integração (opt-in, Postgres + Redis reais):**

```bash
cd packages/backend
pnpm test:catalog-lookup-bench
```

Requer `DATABASE_URL` e `REDIS_URL` no `.env`. O teste seeda 8 filmes `Bench …`, compara `findDetailsByTitlesBatch` vs 8× `findDetailsByTitle` (25 iterações) e imprime média/mediana no stdout. TMDB é mockado — mede só I/O local.

**Baseline medido em desenvolvimento local (2026-09-05, PG + Redis via Docker):**

| Caminho | Média (ms) | Mediana (ms) |
|---------|------------|--------------|
| unitário (8× `findDetailsByTitle`) | 11,03 | — |
| batch (`findDetailsByTitlesBatch`) | 4,81 | — |
| **Speedup** | **~2,29×** | |

Números variam por hardware e tamanho do catálogo; re-rode o comando acima para atualizar. A query batch evoluiu de `UNION ALL` (N seq scans) para `ROW_NUMBER` sobre um único `VALUES` — ganho observado no ambiente local.
