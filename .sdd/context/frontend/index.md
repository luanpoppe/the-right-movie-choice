# Frontend
> `packages/frontend`: React + Vite + Tailwind + Radix. SPA nas rotas `/`, `/login`, `/register`.

## Áreas
- [Chat e welcome](chat-ui.md) — landing, sugestões de prompt, conversa e cards de filme.
- [Lock do chat anônimo](lock-chat-anonimo.md) — trava input após cota; banner `/register` e `/login`.
- [Login e register](login-register.md) — páginas nativas + Google, sessão no `AuthContext`.
- [Refresh silencioso no SPA](refresh-silencioso-spa.md) — `movieClient`, 401 → `/auth/refresh`, ponte para `/login`.
- [Header e tema](header-e-tema.md) — header/topo da app, toggle claro/escuro, ações de auth.
