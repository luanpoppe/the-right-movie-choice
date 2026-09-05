# Tasks: ai-client

> Parte de [`migrate-luanpoppe-ai`](../../plan.md) · spec: [`spec.md`](spec.md)
> `lp:continue` executa UM chunk por vez (respeitando `chunk_size` do `.sdd/config.yaml`) e termina com plano de revisão.

## Convenções

- `[ ]` pendente · `[x]` concluído · `[~]` em revisão pelo usuário
- IDs: `F<n>.C<m>` (n = índice da feature na lista do `plan.md`; m = chunk dentro da feature).

## Chunks

### F1.C1 — Env OpenRouter + Gemini opcional

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/src/env.ts`, `packages/backend/.env.example`
- **Depende de**: nenhum
- **Ordem de revisão**: 1) `env.ts` (contrato de boot) → 2) `.env.example` (documenta as chaves)

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: `OPENROUTER_API_KEY` obrigatória fora de `test` (mesmo `superRefine` + `StringUtils.isEmptyString` do TMDB, sem `return` cedo que pule a outra chave). `GEMINI_API_KEY` deixa de ser obrigatória; usar string vazia como ausente (`z.string().optional().default("")`) para o LangChain legado continuar compilando até a feature de remoção. Documentar as duas no `.env.example`.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`


### F1.C2 — Pacote e constantes de modelo

Metadados (bullets, não checkboxes):
- **Arquivos**: `packages/backend/package.json`, `packages/backend/src/lib/ai/ai-models.ts`
- **Depende de**: F1.C1
- **Ordem de revisão**: 1) `ai-models.ts` → 2) `package.json`

Passos (checkboxes — marcados `[x]` ao implementar):
- [x] **Faz**: `pnpm add @luanpoppe/ai` (`^`). Constantes `AiModels.PRIMARY` / `GEMINI_FALLBACK`. Sem wrapper/`AiClient`: próximas features fazem `new AI()` no call site. Sem alterar providers LangChain.
- [x] **Validação**: `pnpm --filter @the-right-movie-choice/backend test`
