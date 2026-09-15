# Spec: Rotação semanal do pool

> Parte de [`query-suggestions-pool`](../../plan.md)

## Resumo

Job in-process (`node-cron`) roda todo domingo às 03:00 (America/Sao_Paulo): se `count < POOL_SIZE`, completa o pool via IA (`POOL_SIZE - count` inserções, sem delete)  ||  se `count >= POOL_SIZE`, gera 5 textos novos e aplica **+5 inserções e −5 remoções na mesma transação Postgres** — ou não altera nada na rotação. Se a IA falhar, a dedup não inserir os 5, ou qualquer erro no meio, a transação é revertida e o pool permanece intacto.

## Requirements

### REQ-1: Disparo semanal agendado

- **Dado que** o backend está em `NODE_ENV=prod` com o servidor HTTP ativo
- **Quando** chega domingo às 03:00 no fuso `America/Sao_Paulo`
- **Então** o job de rotação do pool é executado automaticamente
- **E** registra log informando início da rotação

### REQ-2: Pool abaixo do mínimo é completado antes da rotação

- **Dado que** o pool tem 97 sugestões persistidas
- **Quando** o job de rotação dispara no horário agendado
- **Então** ele pede à IA exatamente 3 sugestões (`POOL_SIZE - count`)
- **E** insere via `insertManySkipDuplicates` (sem remover registros antigos)
- **E** se o pool atinge pelo menos `POOL_SIZE`, segue para a rotação (+5/−5) na mesma execução
- **E** se ainda ficar abaixo de `POOL_SIZE` (ex.: duplicatas), encerra sem rotação e registra log

### REQ-2-bis: Pool acima do tamanho alvo também roda

- **Dado que** o pool tem 101 sugestões persistidas
- **Quando** o job de rotação dispara
- **Então** ele executa a rotação (+5/−5) como no caminho feliz
- **E** ao concluir com commit, o pool permanece com 101 registros (renova conteúdo, não normaliza o count)

### REQ-3: Rotação feliz com 5 novos únicos

- **Dado que** o pool tem pelo menos 100 sugestões
- **Quando** o job de rotação dispara
- **Então** ele pede 5 sugestões à IA (mesmo provider/prompt/schema de lote do seed, `count=5`)
- **E** em uma única transação Postgres insere os 5 textos novos após normalização
- **E** na mesma transação remove os 5 registros com `createdAt` mais antigo
- **E** ao concluir com commit, o total de registros permanece o mesmo (ex.: 100→100, 101→101)

### REQ-4: Transação atômica — tudo ou nada

- **Entrada** pool com 100 registros; rotação tenta aplicar lote de 5
- **Saída** insert de 5 novos e delete dos 5 mais antigos ocorrem na **mesma** transação Prisma
- **E** o commit só acontece se exatamente 5 textos foram inseridos com sucesso
- **Erro** qualquer falha (IA, insert incompleto, delete, timeout) → rollback  ||  pool permanece com os 100 originais

### REQ-5: Inserção incompleta aborta a rotação

- **Dado que** o pool tem exatamente 100 sugestões
- **Quando** a IA retorna 5 textos mas apenas 3 são inseridos (2 já existiam no pool)
- **Então** a transação é revertida
- **E** nenhum registro é removido
- **E** o pool permanece com 100 itens inalterados
- **E** registra log informando rotação abortada por lote incompleto

### REQ-6: Falha da IA não altera o pool

- **Dado que** o pool tem exatamente 100 sugestões
- **Quando** a IA falha após 3 retries (mesmo limite do seed)
- **Então** nenhuma transação é aberta para mutação do pool
- **E** nenhum registro é inserido nem removido
- **E** registra log de falha da rotação

### REQ-7: Zero inserções após dedup aborta a rotação

- **Dado que** o pool tem exatamente 100 sugestões
- **Quando** a IA responde mas todos os 5 textos são duplicatas (`insertedCount === 0`)
- **Então** a transação é revertida ou nem chega a commitar delete
- **E** nenhum registro é removido
- **E** registra log informando rotação abortada por ausência de textos novos

### REQ-8: Textos existentes no prompt da IA

- **Entrada** pool com 100 textos; job pede lote de 5
- **Saída** chamada ao batch provider inclui a lista completa de textos existentes (via `listTexts()`), como no seed
- **E** temperature 1.2 e modelo PRIMARY do fluxo atual

### REQ-9: Exclusão dos mais antigos

- **Entrada** pool com `createdAt` ascendente `t1` … `t100`; rotação commitou com 5 inserções
- **Saída** registros `t1`–`t5` removidos na mesma transação do insert
- **E** `t6` em diante permanecem

### REQ-10: Serialização com seed

- **Entrada** seed CLI e job de rotação tentam mutar o pool ao mesmo tempo
- **Saída** apenas uma operação roda por vez via `pg_advisory_lock` (mesma chave do seed)
- **E** a segunda espera a primeira terminar

## Edge cases

- Dois processos backend em prod no mesmo horário: advisory lock garante uma rotação por vez  ||  o segundo pode encerrar sem trabalho se o pool já foi atualizado
- `NODE_ENV=dev` ou `test`: cron **não** é registrado — rotação manual via use case/CLI de teste se necessário
- Falha Postgres no delete após insert na mesma transação: rollback automático  ||  pool permanece em 100
- IA retorna 5 textos válidos mas 1 duplicata: rotação inteira abortada (não remove 4 e insere 4)
