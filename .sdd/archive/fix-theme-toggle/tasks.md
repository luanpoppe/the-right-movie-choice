# Tasks: fix-theme-toggle

> Bug [`fix-theme-toggle`](.) · solução: Opção 1 + chave `ui-theme`
> `lp:continue` executa UM chunk por vez.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `C<m>` (bug-fix, trilha única).

## Chunks

### C1 — Toggle alinhado e persistência `ui-theme`

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/frontend/src/components/theme-toggle.tsx`, `packages/frontend/src/layouts/Header.tsx`, `packages/frontend/src/components/theme-provider.tsx`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `theme-toggle.tsx` → 2) `Header.tsx` → 3) `theme-provider.tsx`

Passos (checkboxes — marcados `[~]` ao implementar):
- [x] **Faz**: Clique alterna light/dark (system só até o 1º clique); botão na mesma fileira de auth; `storageKey` default `ui-theme`.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/frontend lint`
