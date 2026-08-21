# Opções de correção: Botão de tema desalinhado e com menu em vez de toggle

> Bug [`fix-theme-toggle`](.) · gerado por `lp:bug-fix` · atualizado em 2026-08-21
> Causa raiz em [`diagnosis.md`](diagnosis.md). Aqui: como corrigir. **Escolha uma opção** antes de implementar.

## Contexto

O botão está fora da fileira de auth (com margem) e o clique abre um menu de três modos. A persistência em `localStorage` (`vite-ui-theme`) já existe; falta alinhar o controle e fazer o clique alternar light↔dark, mantendo `system` só até a primeira escolha.

## Opções

### Opção 1 — Toggle no mesmo flex dos atalhos (recomendada)

- **Abordagem**: mover `ModeToggle` para o mesmo `flex items-center` de `AuthActions` (remover `ChangeTheme`/`mt-5`). Trocar o `DropdownMenu` por um `Button` que lê o tema resolvido (se `system`, usa `prefers-color-scheme`) e chama `setTheme` com o oposto. Não alterar a chave nem o default `system` do `ThemeProvider`.
- **Prós**: cobre as duas causas; reusa persistência; atende 1ª visita = system até o clique; pouca superfície.
- **Contras**: some a escolha explícita de "seguir o SO" depois do primeiro clique (só volta limpando o storage).
- **Esforço / risco**: baixo · 1–2 arquivos (`Header.tsx`, `theme-toggle.tsx`) · risco baixo.

### Opção 2 — Só light/dark no provider

- **Abordagem**: além do alinhamento no header, reduzir `Theme` a `"light" | "dark"`, default `dark` (ou `light`), remover ramo `system` do `ThemeProvider`. Toggle vira `theme === "dark" ? "light" : "dark"`.
- **Prós**: modelo mais simples; um único conceito de tema no app.
- **Contras**: muda o default da 1ª visita (deixa de seguir o SO); quem já tem `system` no storage precisa de fallback; toca `theme-provider.tsx` sem necessidade para o diagnóstico.
- **Esforço / risco**: baixo–médio · 3 arquivos · risco de quebrar valor antigo `system` no localStorage.

### Opção 3 — Alinhar e manter o menu

- **Abordagem**: só reposicionar o botão na fileira de auth e tirar `mt-5`. Clique continua abrindo Light/Dark/System.
- **Prós**: menor diff visual de alinhamento.
- **Contras**: não corrige a causa do clique; não atende o esperado (toggle + persistir com um clique).
- **Esforço / risco**: mínimo · 1 arquivo · risco: entrega incompleta.

## Recomendação

Opção 1: corrige alinhamento e clique sem mexer no contrato do provider, e respeita `system` até o primeiro clique — o que já foi combinado no diagnóstico.

Nota: na implementação, a chave foi renomeada para `ui-theme` a pedido (divergência da Opção 1 que mantinha `vite-ui-theme`).
