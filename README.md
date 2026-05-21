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

A API está disponível em uma instância gratuita da **Oracle Cloud**, com **PM2** e **Redis** via **Docker**.

**Swagger (produção):** [http://164.152.61.119:8080/swagger](http://164.152.61.119:8080/swagger)

## Features Principais

### Backend

- **Recomendações via IA:** Sugestões baseadas em linguagem natural (título, diretor, elenco, ano, streaming, etc.).
- **Histórico de Conversa:** Contexto por sessão no Redis.
- **Saída Estruturada:** JSON validado com **Zod**.
- **Respostas Conversacionais:** Texto amigável além dos dados dos filmes.
- **Arquitetura Desacoplada:** Clean Architecture no pacote `packages/backend`.
- **Testes:** **Vitest** para casos de uso e providers.
- **Documentação:** Swagger gerado a partir dos schemas Zod.

### Frontend

- **Interface de chat** para pedir recomendações e ver filmes sugeridos.
- **Tema claro/escuro**, componentes com Radix UI e Tailwind CSS.
- **Integração com a API** via variáveis `VITE_*` (ver `packages/frontend/.env.example`).

## Próximos Passos

- **Sistema de Contas e Autenticação**
- **Histórico e Listas Pessoais** por usuário
- **Conexão com TMDB via IA** (orquestração MCP)

## 🏛️ Análise Arquitetural do Backend

O backend do projeto é uma implementação prática da **Clean Architecture**, uma abordagem que organiza o software em camadas concêntricas. O princípio fundamental é a **Regra de Dependência**, que dita que as dependências do código devem apontar sempre para dentro, das camadas externas (detalhes de tecnologia) para as camadas internas (regras de negócio).

Isso significa que a camada de **Infrastructure** (onde residem frameworks e drivers de banco de dados) depende da camada de **Application** (que orquestra os casos de uso), que por sua vez depende da camada de **Domain** (o núcleo com as regras de negócio puras). Essa estrutura garante que a lógica de negócio permaneça isolada e independente de detalhes de implementação, como o banco de dados ou a API da web, tornando o sistema mais testável, flexível e fácil de manter.

### Estrutura e Princípios SOLID

A lógica da API fica em `packages/backend/src`, organizada da seguinte forma:

- **`domains/.../domain` (Camada de Domínio):** O núcleo da aplicação. Contém as `Entities` (ex: `MovieRecommendationEntity`) e exceções de negócio, sem dependências externas. É a representação pura do problema que estamos resolvendo.

- **`domains/.../application` (Camada de Aplicação):** Orquestra os fluxos de negócio.
  - **Use Cases:** Contém a lógica da aplicação (ex: `GetMovieRecommendationUseCase`). Ele não sabe _como_ os dados são salvos ou _como_ as recomendações são geradas, apenas que essas operações precisam acontecer.
  - **Interfaces (Ports):** Define os contratos (ex: `IChatHistoryRepository`, `IMovieRecommendationProvider`) que as camadas externas devem implementar. Isso materializa o **Princípio da Inversão de Dependência (DIP)**, pois os casos de uso dependem de abstrações, não de implementações.

- **`domains/.../infrastructure` (Camada de Infraestrutura):** A camada mais externa, onde os detalhes de tecnologia residem.
  - **Adapters:** Implementa as interfaces da camada de aplicação. `ChatHistoryRedisRepository` é o adapter para o `IChatHistoryRepository`, e `LangchainMovieRecommendationProvider` é o adapter para o `IMovieRecommendationProvider`.
  - **HTTP:** Controladores, DTOs e rotas do Fastify, que servem como ponto de entrada para o mundo exterior.
  - **Factories:** Montam as classes, injetando as dependências concretas (adapters) nas abstrações exigidas pelos casos de uso. Elas garantem que a aplicação seja **Aberta para extensão, mas fechada para modificação (OCP)**.

- **`core`:** Contém abstrações (`BaseException`, `IChatHistoryRepository`) que são compartilhadas entre múltiplos domínios, evitando duplicação.

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
- **Banco de Dados (Cache):** Redis (com `ioredis`)
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

- Node.js (v18+)
- [pnpm](https://pnpm.io/) (v10+; o projeto fixa `pnpm@10.20.0` via `packageManager`)
- Docker e Docker Compose (Redis)

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
   No backend, preencha `GEMINI_API_KEY`. No frontend, `VITE_BACKEND_URL` aponta para a API (padrão: `http://localhost:3333`).

4. **Redis:**
   ```bash
   cd packages/backend
   docker compose up -d
   cd ../..
   ```

5. **Subir backend e frontend juntos (recomendado):**
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

## Testes

```bash
pnpm test
```

Roda os testes unitários do pacote `packages/backend`.
