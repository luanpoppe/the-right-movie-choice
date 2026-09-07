# Toggle exclude-watched no chat (frontend)

> Feature `exclude-watched-toggle` da mudança `chat-exclude-watched`. Complementa [exclude-watched-pipeline](../recomendacoes-filmes/exclude-watched-pipeline.md) (backend).

## O que é

Checkbox "Exclude watched movies" nos formulários da welcome e do chat. Só aparece para usuário autenticado (`hasAccessToken`). Padrão ligado. O valor vai no body de `POST /movie/recommendation` como `excludeWatched: boolean` — explícito `false` quando desligado (backend default é `true` se omitido).

## Como funciona

1. **Estado** em `Home.tsx`: `useState(true)` para `excludeWatched`, sem `localStorage`.
2. **Submit** monta `MovieRecommendationRequestDTO`: autenticado inclui `excludeWatched`; anônimo envia só `userMessage`.
3. **Reset** (`handleReset`) restaura `excludeWatched` para `true` junto com novo `chatId` e limpeza de mensagens.
4. **UI** `ExcludeWatchedToggle` — early return `null` se `showToggle` false; desabilitado com `isLoading` ou guest lock.
5. **Props** `Home` → `Welcome`/`Chat` → `Form`/`ChatForm` → `ExcludeWatchedToggle`.

## Decisões

- Checkbox nativo + `Label` (sem componente Switch no projeto) — suficiente para REQ-1/7.
- Estado no `Home`, não no contexto global — escopo mínimo da spec (sessão só).
- `excludeWatched: false` explícito no body quando desligado — evita default `true` do backend para autenticado.

## Notas

- Login/logout mid-session: toggle aparece/some na próxima render; mensagens já enviadas não são refeitas.
- Testes em `pages/specs/Home.spec.tsx` e specs dos componentes do toggle.
