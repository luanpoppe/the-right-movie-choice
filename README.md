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

- **Recomendações via IA:** Sugestões baseadas em linguagem natural; cada resposta retorna até **3 filmes** com título, diretor, elenco, ano, nota IMDb, duração, sinopse, plataforma de streaming e motivo da sugestão.
- **Sugestões de busca via IA:** `GET /movie/queries` gera exemplos criativos de prompts para iniciar uma conversa.
- **Histórico de conversa:** Contexto por sessão no Redis, identificado pelo header `chatid`.
- **Saída estruturada:** JSON validado com **Zod** (entrada, saída e documentação Swagger).
- **Respostas conversacionais:** Texto amigável além dos dados dos filmes.
- **Rotas públicas de filmes:** Recomendações e sugestões de busca **não exigem autenticação** (middleware protegido ainda não implementado).
- **Usuários e autenticação:** Módulo `users` (cadastro com **Prisma** + **bcrypt**) e módulo `auth` com **JWT** de curta duração no body, **refresh token** httpOnly no **Redis** (rotação a cada refresh), logout que revoga o refresh e **login/cadastro com Google** (conta unificada por e-mail). Emissão de sessão centralizada em `AuthSessionFacade`.
- **Logging estruturado:** **Pino** (`lib/logger`) nos fluxos de auth e cadastro.
- **CORS:** `@fastify/cors` com `credentials: true` para `localhost` e deploys `*.vercel.app`.
- **Arquitetura desacoplada:** Clean Architecture no pacote `packages/backend`.
- **Testes:** **Vitest** para casos de uso, providers e mappers.
- **Documentação:** Swagger gerado a partir dos schemas Zod via `fastify-type-provider-zod`.

### Frontend

- **Interface de chat** para pedir recomendações e ver filmes sugeridos.
- **Tema claro/escuro**, componentes com Radix UI e Tailwind CSS.
- **Integração com a API** via variáveis `VITE_*` (ver `packages/frontend/.env.example`).
- **Autenticação:** telas `/login` e `/register` com senha ou botão Google (`@react-oauth/google`).

## Próximos Passos

- **Middleware de rotas protegidas** (`Authorization: Bearer`)
- **Histórico e Listas Pessoais** por usuário
- **Conexão com TMDB via IA** (orquestração MCP)

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
- **Banco de dados:** PostgreSQL (usuários) + Redis (histórico de chat e refresh tokens, `ioredis`)
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
   `db:generate` gera o client em `packages/backend/generated/prisma`. `db:migrate` cria/atualiza as tabelas (modelo `User`: `email`, `name`, `passwordHash?`, `googleId?`).

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

### Postman

Coleção e environments em [`packages/backend/postman`](packages/backend/postman). Importe a coleção e o environment **Local**; o Postman guarda o cookie `refreshToken` após o login para usar em **Refresh** e **Logout**.

## Referência da API

Rotas sob `/movie/*` são **públicas**. Cadastro e login (`/users/register`, `/auth/login`, `/auth/google`) também não exigem `Authorization`. Refresh e logout dependem do cookie httpOnly `refreshToken`.

> Nos exemplos locais, a porta padrão é `3333` (`PORT` no `.env`). Headers HTTP são case-insensitive; o backend valida o campo `chatid` (o cliente pode enviar `chatId`).

### `POST /movie/recommendation`

- **Header obrigatório:** `chatid` (string) — ID da sessão de conversa no Redis.
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
        "durationInMinutes": 120
      }
    ]
  }
  ```

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

## Testes

```bash
pnpm test
```

Roda os testes unitários do pacote `packages/backend` (projeto Vitest `unit` em `packages/backend/vite.config.mts`). Cobertura atual: casos de uso de filmes, auth e users; providers `@luanpoppe/ai`; mapper de erros Prisma.
