# Spec: Página de busca

> Parte de [`movie-catalog-search`](../../plan.md)

## Resumo

Página pública `/search` para achar filme no catálogo TMDB — por texto ou por filtros de discover — e, logado, marcar na biblioteca com as mesmas ações dos cards do chat. Busca, filtros, idioma e página vivem na URL; resultados em `en-US` por padrão, com toggle para `pt-BR`.

## Requirements

### REQ-1: Abrir sem busca mostra populares

- **Dado que** a pessoa abre `/search` sem nenhum filtro
- **Quando** a página carrega
- **Então** o SPA chama a busca por texto sem `query`
- **E** mostra os populares em `en-US`
- **E** a URL permanece `/search`

### REQ-2: Busca por texto

- **Dado que** a pessoa está em `/search`
- **Quando** digita `Interstellar` e aperta Enter (ou o botão Buscar)
- **Então** o SPA chama `GET /movie/catalog/search` com `query=Interstellar`, `page=1` e `language=en-US`
- **E** mostra os cards (título, ano, pôster, sinopse)
- **E** a URL passa a `/search?query=Interstellar`

### REQ-3: Filtros de discover

- **Dado que** a pessoa escolhe gênero Drama, nota mínima 7 e anos de 2010 a 2015
- **Quando** aplica a busca
- **Então** o SPA chama `GET /movie/catalog/discover` com esses filtros
- **E** a URL reflete os filtros (ex.: `?genres=18&minRating=7&yearFrom=2010&yearTo=2015`)
- **E** mostra a página 1 em `en-US`

### REQ-4: Candidatos de pessoa e palavra-chave

- **Dado que** a pessoa digita `Nolan` no filtro de diretor
- **Quando** escolhe o candidato `Christopher Nolan` da lista
- **Então** o SPA adiciona o id `525` ao filtro de direção como um chip
- **E** a busca usa `director=525`
- **E** vários valores no mesmo filtro entram em "ou"

### REQ-5: Carregar mais

- **Dado que** a página 1 está exibida e existe próxima página
- **Quando** a pessoa clica em "Carregar mais"
- **Então** o SPA busca a próxima página com os mesmos filtros
- **E** anexa os novos cards aos anteriores
- **E** a URL passa a `page=2`

### REQ-6: Troca de idioma

- **Dado que** a busca atual está em `en-US`
- **Quando** a pessoa alterna o toggle para Português
- **Então** o SPA refaz a mesma busca com `language=pt-BR`
- **E** títulos e sinopses voltam em português

### REQ-7: Marcar na biblioteca (logado)

- **Dado que** a pessoa está logada e vê um card de resultado
- **Quando** marca favorito, quero ver ou assistido (com nota)
- **Então** o card age como na biblioteca, com persistência otimista
- **E** a marcação aparece em `/my-movies`

### REQ-8: Visitante tenta agir

- **Dado que** a pessoa não está logada
- **Quando** clica em uma ação do card
- **Então** o SPA redireciona para `/login?redirect=<url atual>`
- **E** após entrar volta para a mesma busca e filtros

### REQ-9: TMDB indisponível ou limite

- **Dado que** o backend responde erro (TMDB fora do ar ou limite excedido)
- **Quando** a página faz a busca
- **Então** o SPA mostra uma mensagem de erro com "Tentar novamente"
- **E** não apresenta a lista vazia como se fossem resultados

## Edge cases

- URL com filtros inválidos (nota fora de 0–10, anos ou duração invertidos, certificação sem par) → o SPA normaliza/explica sem chamar a API
- Combobox de candidato sem resultados → estado "nenhum resultado"
- Voltar/avançar do navegador restaura busca, filtros, idioma e página
- Resultado sem pôster ou sem ano → card mostra placeholder
- Múltiplos valores no mesmo filtro de candidato → OR
- Resposta 429 (rate limit do backend) → mesma mensagem de erro com retry

## Contratos expostos

- URL `/search` com query string: `query`, `page`, `language` (`en-US`|`pt-BR`), `genres`, `minRating`, `yearFrom`, `yearTo`, `runtimeFrom`, `runtimeTo`, `certificationCountry`, `certification`, `cast`, `director`, `keyword` (listas separadas por vírgula). Fonte: a implementação da página.
- Consome a API de busca de catálogo da feature `movie-search-api` — contrato por referência.
