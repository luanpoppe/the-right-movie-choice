# Spec: Persistência do status por filme

> Parte de [`user-watched-movies`](../../plan.md)

## Resumo

Cria a tabela `UserMovieEntry` no Postgres (uma linha por usuário + `tmdbId`), a entidade de domínio, a porta `IUserMovieEntryRepository` e o adapter Prisma. Esta feature não expõe HTTP — só o contrato interno que a API de listas vai consumir na feature seguinte.

## Requirements

### REQ-1: Gravar e reler status de um filme

- **Dado que** o usuário autenticado tem `id = 42` e ainda não há entrada para `tmdbId = 157336` (Interestelar)
- **Quando** o repositório persiste `{ watched: true, favorite: false, inWatchlist: true, rating: 9, watchedAt: "2024-06-15T20:00:00.000Z" }`
- **Então** existe exatamente uma linha com `userId = 42`, `tmdbId = 157336` e os valores gravados
- **E** uma leitura por `(42, 157336)` devolve a mesma entrada com `createdAt` e `updatedAt` preenchidos

### REQ-2: Upsert parcial preserva flags não enviados

- **Dado que** já existe entrada com `watched = true`, `favorite = true`, `inWatchlist = false`
- **Quando** o repositório persiste apenas `{ inWatchlist: true }` para o mesmo par usuário + `tmdbId`
- **Então** `watched` e `favorite` permanecem `true`
- **E** `inWatchlist` passa a `true`

### REQ-3: Unicidade por usuário e filme

- **Entrada** duas gravações consecutivas para o mesmo `userId` e `tmdbId`
- **Saída** uma única linha no banco  ||  a segunda operação atualiza a existente, não duplica

### REQ-4: Remover linha quando nenhum flag está ativo

- **Dado que** existe entrada com `watched = false`, `favorite = false`, `inWatchlist = false`
- **Quando** o repositório conclui uma gravação que deixa os três flags em `false`
- **Então** a linha é removida do banco
- **E** leitura por `(userId, tmdbId)` retorna ausência (`null`)

### REQ-5: Metadados de assistido sobrevivem ao desmarcar

- **Dado que** existe entrada com `watched = true`, `rating = 8`, `watchedAt` preenchido
- **Quando** o repositório persiste `{ watched: false }` sem enviar `rating` nem `watchedAt`
- **Então** `rating` e `watchedAt` permanecem com os valores anteriores
- **E** se os três flags ficarem `false`, a linha é removida (REQ-4) — metadados somem junto

### REQ-6: Listar entradas do usuário por flag

- **Dado que** o usuário `id = 42` tem três entradas: A (`watched = true`), B (`favorite = true`), C (`inWatchlist = true`)
- **Quando** o repositório lista com filtro `{ watched: true }`
- **Então** retorna somente A
- **E** filtros `{ favorite: true }` e `{ inWatchlist: true }` retornam B e C respectivamente

### REQ-7: Chave opcional para o catálogo local

- **Entrada** gravação com `movieId = 17` apontando para linha existente em `Movie`
- **Saída** FK válida na coluna `movieId`
- **Erro** `movieId` omitido ou `null` → aceito  ||  entrada pode existir só com `tmdbId`
- **Erro** filme `Movie` referenciado é apagado → `movieId` da entrada vira `null`  ||  demais colunas intactas

### REQ-8: Validação de nota no domínio

- **Entrada** `rating = 7`
- **Saída** aceito
- **Erro** `rating = 0` → rejeição no domínio antes de persistir
- **Erro** `rating = 11` → rejeição no domínio antes de persistir
- **Erro** `rating` omitido ou `null` → aceito
- **E** o Postgres rejeita `rating` fora de 1–10 via `CHECK` (`UserMovieEntry_rating_check`) mesmo se o domínio falhar

## Edge cases

- Usuário apagado (`User` removido) → entradas do usuário removidas em cascata (`onDelete: Cascade`)
- Dois upserts concorrentes no mesmo `(userId, tmdbId)` → unique `(userId, tmdbId)` garante uma linha  ||  última escrita vence
- `tmdbId` negativo ou zero na gravação → rejeição no domínio antes do Prisma
