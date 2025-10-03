# The Right Movie Choice API

[![Status do Projeto](https://img.shields.io/badge/status-ativo-success.svg)]()
[![Linguagem](https://img.shields.io/badge/linguagem-TypeScript-blue.svg)]()
[![Framework](https://img.shields.io/badge/framework-Fastify-lightgrey.svg)]()

Esta é uma API de recomendação de filmes construída com **Node.js** e **TypeScript**, projetada para ser robusta, escalável e de fácil manutenção. O projeto utiliza IA generativa (Google Gemini) e segue estritamente os princípios da **Clean Architecture** e **SOLID**.

## 🚀 Em Produção (Versão Inicial)

A primeira versão desta API está disponível publicamente em uma instância gratuita da **Oracle Cloud**.

O ambiente de produção foi configurado para garantir performance e estabilidade, utilizando:
- **PM2:** para gerenciamento e monitoramento do processo do servidor Node.js.
- **Docker:** para executar o serviço do Redis de forma isolada e consistente.

**A documentação interativa do Swagger para a versão em produção pode ser acessada em:**
### **[http://164.152.61.119:8080/swagger](http://164.152.61.119:8080/swagger)**

## 🎬 Features Principais

- **Recomendações via IA:** Sugestões de filmes baseadas em linguagem natural, com informações detalhadas (título, diretor, elenco, ano, streaming, etc.).
- **Histórico de Conversa:** Persistência de contexto por sessão usando Redis, permitindo recomendações mais inteligentes em interações contínuas.
- **Saída Estruturada:** A IA é instruída a retornar dados em formato JSON, que são validados com **Zod** para garantir a integridade e consistência das respostas.
- **Respostas Conversacionais:** Além dos dados dos filmes, a API gera um texto amigável explicando as sugestões, criando uma experiência de chatbot.
- **Arquitetura Desacoplada:** Construída com base na Clean Architecture, garantindo que a lógica de negócio seja independente de frameworks e tecnologias externas.
- **Alta Testabilidade:** A separação de responsabilidades permite a criação de testes unitários focados e eficientes com **Vitest**, validando a lógica de negócio de forma isolada.
- **Documentação Dinâmica:** A API conta com documentação interativa gerada automaticamente via Swagger, mantendo-se sempre sincronizada com as regras de validação da aplicação.
- **Validação Robusta:** Utilização de **Zod** para validar variáveis de ambiente, requisições HTTP e o retorno da IA, garantindo a segurança e a previsibilidade dos dados.

## 🌟 Próximos Passos e Melhorias Futuras

Esta é apenas a versão inicial do projeto. O objetivo é evoluir a aplicação com novas funcionalidades, transformando-a em uma plataforma completa de descoberta de filmes. O roadmap inclui:

- **Frontend Interativo:** Desenvolvimento de uma interface de usuário amigável para consumir a API, facilitando a interação e a visualização das recomendações.
- **Sistema de Contas e Autenticação:** Implementação de funcionalidades de cadastro, login e autenticação para oferecer uma experiência personalizada aos usuários.
- **Histórico e Listas Pessoais:** Permitir que usuários salvem o histórico de filmes sugeridos e criem listas de "filmes para assistir no futuro".
- **Conexão Direta com o TMDB via IA:** Criação de um módulo orquestrador (MCP) para que a IA possa fazer requisições diretamente à API do The Movie Database (TMDB), buscando informações em tempo real e enriquecendo ainda mais as recomendações.

## 🏛️ Análise Arquitetural

O projeto é uma implementação prática da **Clean Architecture**, uma abordagem que organiza o software em camadas concêntricas. O princípio fundamental é a **Regra de Dependência**, que dita que as dependências do código devem apontar sempre para dentro, das camadas externas (detalhes de tecnologia) para as camadas internas (regras de negócio).

Isso significa que a camada de **Infrastructure** (onde residem frameworks e drivers de banco de dados) depende da camada de **Application** (que orquestra os casos de uso), que por sua vez depende da camada de **Domain** (o núcleo com as regras de negócio puras). Essa estrutura garante que a lógica de negócio permaneça isolada e independente de detalhes de implementação, como o banco de dados ou a API da web, tornando o sistema mais testável, flexível e fácil de manter.

### Estrutura e Princípios SOLID

- **`src/domain` (Camada de Domínio):** O núcleo da aplicação. Contém as `Entities` (`MovieRecommendationEntity`) e exceções de negócio, sem dependências externas. É a representação pura do problema que estamos resolvendo.

- **`src/application` (Camada de Aplicação):** Orquestra os fluxos de negócio.

  - **Use Cases:** Contém a lógica da aplicação (`GetMovieRecommendationUseCase`). Ele não sabe _como_ os dados são salvos ou _como_ as recomendações são geradas, apenas que essas operações precisam acontecer.
  - **Interfaces (Ports):** Define os contratos (`IChatHistoryRepository`, `IMovieRecommendationProvider`) que as camadas externas devem implementar. Isso materializa o **Princípio da Inversão de Dependência (DIP)**, pois os casos de uso dependem de abstrações, não de implementações.

- **`src/infrastructure` (Camada de Infraestrutura):** A camada mais externa, onde os detalhes de tecnologia residem.

  - **Adapters:** Implementa as interfaces da camada de aplicação. `ChatHistoryRedisRepository` é o adapter para o `IChatHistoryRepository`, e `LangchainMovieRecommendationProvider` é o adapter para o `IMovieRecommendationProvider`.
  - **HTTP:** Controladores, DTOs e rotas do Fastify, que servem como ponto de entrada para o mundo exterior.
  - **Factories:** Montam as classes, injetando as dependências concretas (adapters) nas abstrações exigidas pelos casos de uso. Elas garantem que a aplicação seja **Aberta para extensão, mas fechada para modificação (OCP)**.

- **`src/core`:** Contém abstrações (`BaseException`, `IChatHistoryRepository`) que são compartilhadas entre múltiplos domínios, evitando duplicação.

A aplicação de cada classe a uma única responsabilidade (ex: um repositório apenas persiste dados, um caso de uso apenas orquestra um fluxo) garante o **Princípio da Responsabilidade Única (SRP)**.

## 🛠️ Tecnologias Utilizadas

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

## 📖 Documentação da API (Swagger + Zod)

Para o ambiente de desenvolvimento local, a documentação interativa da API pode ser acessada em:
**`http://localhost:3333/swagger`**

(Para a versão em produção, acesse o link no topo deste README).

### A Sinergia entre Swagger e Zod

A grande vantagem desta abordagem é que a documentação da API é gerada a partir dos mesmos schemas do **Zod** que são usados para a validação das requisições. Isso garante que a documentação **nunca ficará dessincronizada** com as regras reais que a API impõe, eliminando uma fonte comum de bugs e inconsistências.

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

- Node.js (v18 ou superior)
- Docker e Docker Compose

### Guia Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/luanpoppe/the-right-movie-choice.git
    cd the-right-movie-choice
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Configure as variáveis de ambiente:**
    Copie o arquivo `.env.example` para um novo arquivo chamado `.env` e preencha sua `GEMINI_API_KEY`.
    ```bash
    cp .env.example .env
    ```
4.  **Inicie o serviço do Redis:**
    Use o Docker Compose para subir o container do Redis em segundo plano.
    ```bash
    docker compose up -d
    ```
5.  **Execute a aplicação:**
    ```bash
    npm start
    ```
    O servidor será iniciado em `http://localhost:3333` (ou na porta definida em seu arquivo `.env`).

## 📡 Referência da API

### `POST /movie/recommendation`

Endpoint principal para solicitar recomendações de filmes.

- **Header Obrigatório:**

  - `chatid` (string): Um ID único para identificar e manter o contexto da sessão de conversa.

- **Corpo da Requisição:**

    ```json
    {
      "userMessage": "Quero um filme de comédia leve para relaxar."
    }
    ```

- **Exemplo de uso com `curl` (para a API em produção):**
    ```bash
    curl --location 'http://164.152.61.119:8080/movie/recommendation' \
    --header 'chatid: minha-sessao-xyz-789' \
    --header 'Content-Type: application/json' \
    --data '{
        "userMessage": "Sugira um filme de ficção científica com uma boa história."
    }'
    ```
- **Respostas Possíveis:**
  - `200 OK`: Recomendação gerada com sucesso.
  - `400 Bad Request`: Requisição inválida (e.g., falta do header `chatid` ou do campo `userMessage`).
  - `500 Internal Server Error`: Falha interna, como a IA retornando um formato de dados inesperado.

## 🧪 Como Executar os Testes

Para rodar a suíte de testes unitários, utilize o seguinte comando:

```bash
npm test
```
