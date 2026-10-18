# Spec: Editar e deletar a marcação de assistido na modal

> Parte de [`watched-entry-modal`](../../plan.md)

## Resumo

Ao clicar em "Watched" num filme já marcado como assistido, o app abre a modal pré-carregada com a nota e a data salvas, permitindo atualizar esses dados ou deletar a marcação. O delete aplica na hora e oferece um "desfazer" inline na barra do card por 7 segundos.

## Requirements

### REQ-1: Clicar em "Watched" já marcado abre a modal pré-carregada

- **Dado que** estou autenticado e o filme `157336` está marcado como assistido com nota `8` e data `2026-03-15`
- **Quando** clico no botão "Watched" do card
- **Então** a modal abre com a nota `8` e a data `2026-03-15` preenchidas
- **E** a modal aparece no modo edição, com o botão "Delete"

### REQ-2: Atualizar nota e data

- **Dado que** a modal de edição do filme `157336` está aberta com nota `8` e data `2026-03-15`
- **Quando** mudo a nota para `9` e clico em "Save"
- **Então** o app envia PATCH com `watched: true` e `rating: 9`
- **E** a modal fecha
- **E** a entrada do filme passa a ter nota `9`

### REQ-3: Esvaziar um campo limpa o valor

- **Dado que** a modal de edição do filme `157336` está aberta com nota `8` e data `2026-03-15`
- **Quando** apago a nota e a data e clico em "Save"
- **Então** o app envia PATCH com `watched: true`, `rating: null` e `watchedAt: null`
- **E** o filme continua assistido, sem nota nem data

### REQ-4: Deletar a marcação de assistido

- **Dado que** a modal de edição do filme `157336` está aberta, assistido com nota `8` e data `2026-03-15`
- **Quando** clico em "Delete"
- **Então** o app envia PATCH com `watched: false`, `rating: null` e `watchedAt: null`
- **E** a modal fecha
- **E** o filme deixa de aparecer como assistido

### REQ-5: Desfazer o delete dentro de 7 segundos

- **Dado que** acabei de deletar a marcação do filme `157336`, que tinha nota `8` e data `2026-03-15`
- **Quando** clico em "Undo" na barra do card, dentro dos 7 segundos
- **Então** o app envia PATCH com `watched: true`, `rating: 8` e `watchedAt: 2026-03-15T00:00:00.000Z`
- **E** o filme volta a aparecer como assistido com nota e data

### REQ-6: Nota fora de 1–10 bloqueia o save

- **Dado que** a modal de edição do filme `157336` está aberta com nota `8`
- **Quando** digito `11` no campo de nota e clico em "Save"
- **Então** o campo de nota mostra uma mensagem de erro
- **E** nenhum PATCH é enviado
- **E** a modal permanece aberta

### REQ-7: Data exibida e gravada com granularidade de dia

- **Entrada** `watchedAt` `"2026-03-15T03:00:00.000Z"`
- **Saída** campo de data exibindo `"2026-03-15"`
- **E** ao salvar, grava `watchedAt` como `"2026-03-15T00:00:00.000Z"`
- **E** `watchedAt` nulo aparece como campo de data vazio

## Edge cases

- Cliques rápidos no mesmo filme com respostas em ordem invertida (o `Delete` responde depois do `Undo`) → o app descarta a resposta obsoleta e mantém o estado do PATCH mais recente, sem regredir.
- Outra ação no mesmo card antes dos 7s (marcar assistido de novo, favoritar): o "desfazer" desaparece imediatamente.
- Falha no PATCH (atualizar, deletar ou desfazer): rollback otimista e toast de erro genérico; a entrada volta ao estado anterior.
- Visitante: o botão Watched continua levando ao CTA de login  ||  sem modal e sem PATCH.
- Filme sem `tmdbId`: a barra de ações não é exibida (comportamento atual).

## Contratos expostos

- PATCH `/movie/user-entries/:tmdbId` — body validado por `packages/backend/src/domains/movies/infrastructure/http/dto/user-movie-entry.dto.ts:UserMovieEntryPatchDTOSchema`; já existe, sem mudança.
