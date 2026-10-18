# Ações nos cards (assistido, favorito, watchlist)
> Atualizado em 2026-10-14 · fontes: mudança `watched-entry-modal`, `MovieCardListActions`, `MovieCardWatchedModal`, `MovieCardWatchedModalUtils`, `UserMovieEntriesProvider`

## O que é
Toggles de assistido, favorito e watchlist nos cards de filme (chat, busca, welcome, biblioteca), persistidos via API autenticada por `tmdbId`. O assistido ganhou modal com nota/data editável e deleção reversível.

## Como funciona
- **Service** (`UserMovieEntryService`): `listEntries()` → GET `/movie/user-entries`; `patchEntry(tmdbId, patch)` → PATCH parcial.
- **Contexto** (`UserMovieEntriesProvider`): hidrata ao montar quando há `accessToken`; mapa `tmdbId→entry`; `patchEntry` otimista, sequência por `tmdbId` (descarta resposta fora de ordem) e rollback + toast genérico em falha.
- **Regras do assistido** (`MovieCardWatchedModalUtils`, em `features/movies/utils/`): converte data ISO↔input, classifica a nota (vazia/válida/inválida) e monta os patches de salvar (por modo) e deletar.
- **UI** (`MovieCard` → `MovieCardListActions`): guest vê CTA login/registro (sem PATCH); autenticado alterna favorito/watchlist direto. Clicar em Watched **sempre abre a modal** — criação quando o filme não é assistido, edição (pré-carregada) quando já é.
- **Modal** (`MovieCardWatchedModal`): modo criação ("Mark as watched"/"Confirm") ou edição ("Watched"/"Save"/"Delete"); nota inválida mostra erro inline e bloqueia o save; esvaziar nota/data na edição limpa o valor.
- **Desfazer**: após deletar, um "Watched removed / Undo" aparece inline na barra do card por 7s (`UNDO_WINDOW_MS`), restaurando watched+nota+data; qualquer outra ação no card cancela a janela.
- **Integração** (`Home`): quando chat iniciado e usuário logado, envolve `<Chat />` no provider. Guest permanece sem provider.

## Decisões e porquês
- Split guest/autenticado em `MovieCardListActions` — guest não chama `useUserMovieEntries` (evita exigir Provider para visitante).
- Modal única para criar e editar — o modo é derivado de `flags.watched`, não de uma prop. (origem: `watched-entry-modal`)
- Campo vazio significa por modo: na criação é **omitido** do patch (preserva o default do backend); na edição vira **`null`** (limpa). (origem: `watched-entry-modal`, REQ-3)
- Deletar = `watched:false` + nota/data `null`, sem tocar favorite/watchlist; o snapshot do desfazer é capturado **na abertura da modal**, porque o patch otimista de delete apaga a entrada antes do callback. (origem: `watched-entry-modal`, REQ-4/5)
- Regras do assistido em `features/movies/utils/` — não no arquivo do componente nem em `components/` (pasta de UI). (origem: `watched-entry-modal`, F1.C1)
- Merge utils em `context/` — lógica otimista perto do provider, não em `utils/` genérico.

## Notas
- Cards sem `tmdbId` (miss no catálogo) não exibem barra de ações.
- Ponto em aberto do `F1.C2`: o `useEffect` de pré-carga depende de `rating`/`watchedAt` salvos, então um rollback após falha de save pode resetar o formulário ainda aberto.
- Testes unitários em `context/specs/`, `components/specs/` e `features/movies/utils/specs/`.
