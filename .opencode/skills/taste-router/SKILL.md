---
name: taste-router
description: Ponto de partida para o pacote Taste Skill. Use quando o usuário pedir para criar, redesenhar ou dirigir visualmente uma interface (landing page, portfolio, site de marketing, telas mobile, board de marca) e for preciso decidir QUAIS skills do Taste carregar e em que ordem. Mapeia o brief para as skills de base, estilo, output e geração de imagem.
---

# Taste Router

Ponto de entrada para as 13 skills do Taste Skill instaladas em `.agents/skills/`.
Cada skill do Taste é autocontida e não conhece as outras, então este roteador é quem
decide a composição.

Objetivo: escolher o **menor conjunto** de skills que resolve o brief e carregá-las na
ordem certa. Não empilhar skills conflitantes.

## Passo 1 - Classificar o entregável

Leia o pedido e encaixe em um destes tipos. Isso já elimina a maioria das skills.

| Entregável | O que o usuário quer | Skills candidatas |
| --- | --- | --- |
| **Código** (UI funcional) | "faz uma landing", "monta esse site", "cria a tela" | 1 base + (opcional) 1 estilo + (opcional) output |
| **Imagem** (só referência visual) | "gera os comps", "referências de tela", "board de marca" | `imagegen-frontend-web`, `imagegen-frontend-mobile`, `brandkit` |
| **Imagem e depois código** | "gera as referências e implementa", "image to code" | `image-to-code` (pipeline completo) |
| **Upgrade visual de código existente** | "melhora a UI que já tenho", "redesenha essa página" | `redesign-existing-projects` + base |

Se for só imagem: carregue a skill de imagem correspondente e pare. Nunca carregue skill
de imagem para tarefa que pede código.

## Passo 2 - Escolher a skill de base (exatamente UMA)

Só para entregáveis de **código**.

- **Default** -> `design-taste-frontend` (v2). Lê o brief, infere a direção e ajusta os
  três dials (`DESIGN_VARIANCE` / `MOTION_INTENSITY` / `VISUAL_DENSITY`). É o ponto de
  partida recomendado pelo próprio pacote.
- **Modelo GPT/Codex** ou o brief pede variação de layout e motion mais agressivos ->
  `gpt-taste`.
- **Compatibilidade exata com v1** (raro; só se v2 quebrar algo específico) ->
  `design-taste-frontend-v1`.

Nunca carregue duas dessas juntas - elas se sobrepõem e se contradizem.

## Passo 3 - Camada de estilo opcional (no máximo UMA)

Carregue **apenas quando o brief já declara a direção visual**. A base já adapta o estilo
pelos dials; a camada de estilo só reforça quando a direção está fixada.

| Sinal no brief | Skill de estilo |
| --- | --- |
| "minimalista", "editorial", "Linear", "Notion", "contido", "clean" | `minimalist-ui` |
| "premium", "luxury", "calmo", "caro", "Apple-y", "soft" | `high-end-visual-design` |
| "brutalista", "swiss", "mecânico", "cru", "industrial" | `industrial-brutalist-ui` |
| "Google Stitch" ou precisa exportar um `DESIGN.md` | `stitch-design-taste` |

Se o brief não fixa direção, pule esta camada e deixe a base inferir.

## Passo 4 - Camada de reforço opcional

- O agente costuma truncar saída ou deixar placeholders -> `full-output-enforcement`.
  Compõe com qualquer base.

## Passo 5 - Carregar e executar

1. Carregue as skills escolhidas pela ferramenta `skill`, na ordem: base -> estilo ->
   output. Use o **ID** exato (o nome da pasta), não o título.
2. Siga a **Seção 0 (Brief Inference)** da skill de base: declare o "Design Read" em uma
   linha antes de qualquer código.
3. Se o brief estiver ambíguo, faça **uma** pergunta - nunca um formulário.

## Regras de composição (guardas)

- **Uma base por vez.** `design-taste-frontend` e `gpt-taste` não convivem.
- **Uma camada de estilo por vez.** Direções diferentes se anulam.
- **Estilo é opcional.** Base sozinha resolve briefs sem direção fixada.
- **Imagem nao gera código.** `imagegen-*` e `brandkit` produzem só imagens.
- **v2 por padrão.** Só recorra a `design-taste-frontend-v1` se houver motivo explícito.
- **Sem skills de frontend para tarefa que não é frontend.** Dashboard, tabela de dados
  e UI de produto multi-etapa estão fora do escopo do Taste - a base avisa sozinha.

## Exemplos

- *"Faz uma landing SaaS limpa pra público técnico."*
  -> `design-taste-frontend`. Sem camada de estilo (base infere).

- *"Redesenha esse site existente mantendo as rotas."*
  -> `redesign-existing-projects` + `design-taste-frontend`.

- *"Preciso de comps de tela de app mobile pra apresentar."*
  -> `imagegen-frontend-mobile` (só imagem).

- *"Gera as referências da landing e depois implementa."*
  -> `image-to-code`.

- *"Landing premium e minimalista, e o output ta saindo cortado."*
  -> `design-taste-frontend` + `minimalist-ui` + `full-output-enforcement`.
