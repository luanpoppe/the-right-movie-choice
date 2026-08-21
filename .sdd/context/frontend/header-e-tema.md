# Header e tema
> Atualizado em 2026-08-21 · fontes: `packages/frontend/src/layouts/Header.tsx`, `packages/frontend/src/components/theme-provider.tsx`, `packages/frontend/src/components/theme-toggle.tsx`, `packages/frontend/src/Root.tsx`

## O que é
Topo da SPA: marca, atalhos de auth e tema claro/escuro. Não participa da lógica de recomendação.

## Como funciona
- `Header` no layout: logo/título recarregam a página; `AuthActions` mostra Entrar/Criar conta ou Sair conforme `useAuth().accessToken`.
- `ModeToggle` e `AuthActions` ficam na mesma fileira (`flex items-center gap-2`).
- `ModeToggle` é um botão único: o clique chama `setTheme` com light ou dark. Enquanto o valor persistido (ou o default) for `system`, a aparência segue `prefers-color-scheme` até o primeiro clique.
- `ThemeProvider` aplica a classe no `documentElement` e grava em `localStorage` com default `storageKey = "ui-theme"`. Toaster no `Root`.

## Decisões e porquês
- Clique no título = reload — zera o chat da `Home` (estado só em memória) de forma simples.
- Auth no header, não no chat — recomendações continuam usáveis deslogado.
- Chave de persistência sem prefixo do bundler (`ui-theme`, não `vite-ui-theme`) — o nome descreve o dado, não a ferramenta (origem: `fix-theme-toggle`, 2026-08-21).
- Clique no tema = toggle light/dark, não menu Light/Dark/System — `system` vale só até a primeira escolha explícita (origem: `fix-theme-toggle`, 2026-08-21).

## Notas
Componentes UI em `components/ui/*` (shadcn/Radix + Tailwind).
