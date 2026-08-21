# Diagnóstico: Botão de tema desalinhado e com menu em vez de toggle

> Bug [`fix-theme-toggle`](.) · gerado por `lp:bug-fix` · atualizado em 2026-08-21
> Entendimento e **causa raiz** do bug. As opções de correção ficam em [`solutions.md`](solutions.md).

## Resumo

O controle de tema no header não acompanha os atalhos de conta e o clique não alterna claro/escuro, o que deixa o topo da página desalinhado e impede guardar o tema com um clique.

## Sintomas e reprodução

- **Sintoma**: no header, o botão circular (ícone de lua no dark) fica mais baixo que "Entrar" / "Criar conta"; o clique abre lista Light / Dark / System.
- **Esperado**: mesma fileira e eixo vertical dos atalhos de auth; um clique alterna light↔dark; persistir no localStorage; sem chave ainda, permanece `system` até o primeiro clique.
- **Reprodução**: abrir qualquer página com Header → olhar o canto direito → clicar o botão circular.
- **Escopo**: frontend (local e deploy); todas as rotas que usam `Header`.

## Investigação

- `Header.tsx:9-14` — `ChangeTheme` envolve o toggle com `mt-5 mr-5`.
- `Header.tsx:82-98` — o bloco do tema é irmão do `container`, fora do `flex` de `AuthActions`.
- `theme-toggle.tsx:16-35` — `DropdownMenu` com três itens; o trigger não chama `setTheme`.
- `theme-provider.tsx:26-31` — default `system`; lê `localStorage` na chave `vite-ui-theme`.
- `theme-provider.tsx:53-55` — `setTheme` já grava no `localStorage`.

## Causa raiz

Há duas causas no mesmo header: o controle vive fora da fileira de auth, com margem que o desloca; e o clique abre um menu de três modos em vez de alternar o tema resolvido. A persistência já existe — só entra em light/dark depois de uma escolha no menu.

## Impacto

- **Afeta**: qualquer visitante da SPA (logado ou não); gravidade baixa (só UX do header).
- **Risco de não corrigir**: o topo da página continua desalinhado; a preferência explícita light/dark só muda se o usuário achar o menu.
