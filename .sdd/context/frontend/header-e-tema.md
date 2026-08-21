# Header e tema
> Atualizado em 2026-08-21 · fontes: `layouts/Header.tsx`, `theme-provider.tsx`, `theme-toggle.tsx`, `Root.tsx`

## O que é
Chrome visual da SPA: marca, atalhos de auth e tema claro/escuro. Não participa da lógica de recomendação.

## Como funciona
- `Header` no layout: logo/título recarregam a página; `AuthActions` mostra Entrar/Criar conta ou Sair conforme `useAuth().accessToken`.
- Logout chama `AuthService.logout` e `clearSession` (mesmo se a API falhar, limpa o token local).
- `ThemeProvider` + `ModeToggle` (Radix/shadcn). Toaster no `Root`.

## Decisões e porquês
- Clique no título = reload — zera o chat da `Home` (estado só em memória) de forma simples.
- Auth no header, não no chat — recomendações continuam usáveis deslogado.

## Notas
Componentes UI em `components/ui/*` (shadcn/Radix + Tailwind).
