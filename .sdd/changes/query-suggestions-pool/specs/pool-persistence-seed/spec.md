# Spec: Persistência e seed do pool

> Parte de [`query-suggestions-pool`](../../plan.md)

## Resumo

Cria a tabela Postgres do pool de sugestões de busca, o repositório Prisma e o seed idempotente que popula até 100 textos via IA (lotes de 25), disparado automaticamente após `db:migrate` quando o pool estiver incompleto.

## Requirements

### REQ-1: Seed automático após migrate

- **Dado que** o pool tem menos de 100 registros (incluindo zero)
- **Quando** o desenvolvedor roda `pnpm db:migrate` no backend
- **Então** o fluxo de migrate termina com sucesso
- **E** o seed de sugestões é executado ao final, sem comando extra
- **E** ao concluir, o pool tem no máximo 100 registros

### REQ-2: Seed idempotente com pool parcial

- **Dado que** o pool já tem 37 sugestões persistidas
- **Quando** o seed roda (via migrate ou comando manual equivalente)
- **Então** ele calcula quantas faltam para 100
- **E** faz chamadas IA pedindo lotes de até 25 itens, no máximo 4 chamadas por execução
- **E** persiste apenas textos novos após normalização
- **E** não apaga nem sobrescreve os 37 existentes

### REQ-3: Pool cheio não reprocessa

- **Dado que** o pool já tem exatamente 100 registros
- **Quando** o seed roda
- **Então** ele encerra imediatamente sem chamar IA
- **E** registra log informando que o pool já está completo

### REQ-4: Persistência com casing original

- **Entrada** `"  Sci-Fi movies from the 90s  "` (resposta da IA)
- **Saída** coluna `text` persistida e usada na exibição: `"Sci-Fi movies from the 90s"` (trim nas pontas, casing preservado)

### REQ-5: Unicidade via coluna normalizada

- **Entrada** inserção de `"Action movies with a twist"` quando já existe `textNormalized = "action movies with a twist"`
- **Saída** o insert é ignorado (skip silencioso, sem erro fatal)
- **E** o contador do pool não incrementa para esse item
- **E** `textNormalized` é derivado de `text` com trim + lowercase antes do insert

### REQ-6: Prompt com existentes

- **Entrada** pool com 40 textos já salvos; próxima chamada IA do seed pedindo 25 itens
- **Saída** o prompt inclui a lista completa dos 40 valores de `text` (casing original) para a IA evitar repetição
- **E** a temperatura e o tom seguem `MovieQueryExamplesPrompts` adaptado para count variável

### REQ-7: Retry de lote IA

- **Entrada** chamada IA do seed falha (timeout ou schema inválido)
- **Erro** até 3 tentativas automáticas no mesmo lote
- **E** se a 3ª falhar, os lotes já salvos nesta execução permanecem no banco
- **E** o processo termina com código de erro não-zero e log da falha

### REQ-8: Duplicatas dentro do lote

- **Entrada** IA retorna 25 itens, mas 4 são duplicatas entre si ou já existem no pool
- **Saída** as 21 válidas são persistidas
- **E** o lote não é reexecutado por causa das duplicatas (aceita parcial)

## Edge cases

- Duas execuções simultâneas do seed: `UNIQUE` no banco evita duplicata  ||  ambas podem chamar IA, mas inserts conflitantes são ignorados
- IA retorna array vazio ou com menos de 25 itens: salva o que vier de válido  ||  próxima execução do seed continua completando
- Falha de conexão Postgres durante insert: lote corrente falha  ||  lotes anteriores da mesma execução já commitados permanecem

## Contratos expostos

- Modelo Prisma: `packages/backend/prisma/schema.prisma:MovieQuerySuggestion`
- Script npm: `db:migrate` do backend encadeia migrate + seed (`pnpm --filter @the-right-movie-choice/backend db:migrate`).
- Comando manual adicional: `pnpm seed:query-suggestions` no backend, equivalente ao seed do pós-migrate.
