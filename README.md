# The Right Movie Choice

[![Status do Projeto](https://img.shields.io/badge/status-ativo-success.svg)]()
[![Linguagem](https://img.shields.io/badge/linguagem-TypeScript-blue.svg)]()

Plataforma de recomendação de filmes com **API** (Node.js + Fastify) e **interface web** (React + Vite). O backend usa IA generativa (Google Gemini), segue **Clean Architecture** e **SOLID**; o frontend consome a API para chat e exibição das sugestões.

O repositório é um **monorepo pnpm**:

```
packages/
  backend/   # API Fastify (@the-right-movie-choice/backend)
  frontend/  # App React + Vite (@the-right-movie-choice/frontend)
```

## Em Produção (Versão Inicial)

A API está disponível em uma instância gratuita da **Oracle Cloud**, com **PM2** e **Redis** via **Docker**. O PostgreSQL do módulo de usuários é usado no ambiente local; o deploy em produção ainda não inclui esse banco.

**Swagger (produção):** [http://164.152.61.119:8080/swagger](http://164.152.61.119:8080/swagger)

## Features Principais

### Backend

- **Recomendações via IA:** Sugestões baseadas em linguagem natural (título, diretor, elenco, ano, streaming, etc.).
- **Histórico de Conversa:** Contexto por sessão no Redis.
- **Saída Estruturada:** JSON validado com **Zod**.
- **Respostas Conversacionais:** Texto amigável além dos dados dos filmes.
- **Arquitetura Desacoplada:** Clean Architecture no pacote `packages/backend`.
- **Usuários e autenticação:** Módulo `users` (cadastro com **Prisma** + **bcrypt**) e módulo `auth` com **JWT** de curta duração no body, **refresh token** httpOnly no **Redis** (rotação a cada refresh) e logout que revoga o refresh.
- **Testes:** **Vitest** para casos de uso e providers.
- **Documentação:** Swagger gerado a partir dos schemas Zod.

### Frontend

- **Interface de chat** para pedir recomendações e ver filmes sugeridos.
- **Tema claro/escuro**, componentes com Radix UI e Tailwind CSS.
- **Integração com a API** via variáveis `VITE_*` (ver `packages/frontend/.env.example`).

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

- **`application` (Camada de Aplicação):** Orquestra fluxos via **use cases** (ex.: `GetMovieRecommendationUseCase`, `CreateUserUseCase`). Depende de abstrações do domínio, não de Prisma ou Redis diretamente (**DIP**).

- **`infrastructure` (Camada de Infraestrutura):** Adapters concretos (`PrismaUserRepository`, `ChatHistoryRedisRepository`), **mappers**, **factories** de composição e, onde aplicável, HTTP (controllers, DTOs, rotas Fastify).

- **`core`:** Abstrações compartilhadas entre contextos (`BaseException`, `IChatHistoryRepository`).

- **`shared`:** Utilitários e constantes transversais (ex.: `PrismaUtil`, `BCRYPT_SALT_ROUNDS`).

- **`lib`:** Clientes técnicos (ex.: `lib/prisma`, `lib/redis`, LangChain).

A aplicação de cada classe a uma única responsabilidade (ex: um repositório apenas persiste dados, um caso de uso apenas orquestra um fluxo) garante o **Princípio da Responsabilidade Única (SRP)**.

## 🛠️ Tecnologias Utilizadas

O projeto agora é um monorepo gerenciado com **pnpm workspaces**. As tecnologias foram divididas entre as frentes:

**Backend:**
- **Runtime:** Node.js
- **Linguagem:** TypeScript
- **Framework Web:** Fastify
- **Validação de Schemas:** Zod
- **Testes:** Vitest
- **IA Generativa:** Google Gemini via Langchain
- **ORM:** Prisma 7 (driver adapter `@prisma/adapter-pg`)
- **Banco de Dados:** PostgreSQL (persistência) + Redis (cache de histórico de chat, `ioredis`)
- **Senhas:** bcrypt
- **Auth:** JWT (`jose`) + refresh em Redis + cookies (`@fastify/cookie`)
- **Documentação da API:** Fastify Swagger
- **Variáveis de Ambiente:** Dotenv
- **Execução em TS:** `tsx`
- **Gerenciador de Processos (Prod):** PM2

**Frontend:**
- **Framework UI:** React
- **Linguagem:** TypeScript
- **Bundler:** Vite
- **Estilização:** Tailwind CSS
- **Componentes:** Radix UI
- **Requisições:** Axios
- **Validação:** Zod

## Documentação da API (Swagger)

**Local:** `http://localhost:3333/swagger` (com o backend rodando).

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
   No backend, preencha `GEMINI_API_KEY`, `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET` e, se usar Docker local, `POSTGRES_PORT`. A porta em `DATABASE_URL` deve ser a mesma de `POSTGRES_PORT` (ex.: `5433` nos dois, se `5432` já estiver em uso no host). No frontend, `VITE_BACKEND_URL` aponta para a API (padrão: `http://localhost:3333`) — requisições autenticadas devem usar `withCredentials: true` no Axios para enviar o cookie de refresh.

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
   `db:generate` gera o client em `packages/backend/generated/prisma`. `db:migrate` cria/atualiza as tabelas (ex.: `User`).

6. **Subir backend e frontend juntos (recomendado):**
   ```bash
   pnpm dev
   ```
   - API: `http://localhost:3333` (porta configurável em `packages/backend/.env`)
   - UI: `http://localhost:5173` (Vite)

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

### `POST /movie/recommendation`

- **Header obrigatório:** `chatid` (string) — ID da sessão de conversa.
- **Body:**
  ```json
  {
    "userMessage": "Quero um filme de comédia leve para relaxar."
  }
  ```

**Exemplo (produção):**
```bash
curl --location 'http://164.152.61.119:8080/movie/recommendation' \
  --header 'chatid: minha-sessao-xyz-789' \
  --header 'Content-Type: application/json' \
  --data '{"userMessage": "Sugira um filme de ficção científica com uma boa história."}'
```

**Respostas:** `200`, `400` (validação), `500` (erro interno / schema da IA).

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

**Respostas:** `201` (usuário criado, sem `passwordHash`), `400` (validação), `409` (e-mail já cadastrado).

> Em produção, este endpoint ainda não está disponível (PostgreSQL local apenas).

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

Roda os testes unitários do pacote `packages/backend`.
