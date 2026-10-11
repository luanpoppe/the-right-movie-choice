# Amizades e grupos de usuários

> **id**: `user-friends-and-groups` · **criada**: 2026-09-17 · **idioma**: pt-BR

## Contexto

O app hoje trata cada usuário de forma isolada: listas de filmes (`UserMovieEntry`), conversas e recomendações são individuais. Esta mudança introduz relações sociais — amizades bilaterais e grupos de usuários — como base para funcionalidades futuras (watchlist compartilhada do grupo e busca agregada excluindo filmes já assistidos por qualquer membro).

## Decisões macro

- **Decisão**: Escopo desta mudança = fundação social (amizade + grupos + UI básica). **Por quê**: desacopla modelagem/API/UI da visão futura de listas e busca em grupo. **Alternativa descartada**: entregar watchlist/busca agregada já agora.
- **Decisão**: Amizade bilateral com solicitação e aceite. **Por quê**: controle explícito de quem entra na rede; evita vínculo unilateral indesejado. **Alternativa descartada**: amizade instantânea ou follow unidirecional.
- **Decisão**: Descoberta de usuários por busca de e-mail cadastrado. **Por quê**: `User.email` já existe e é único; sem novo campo público. **Alternativa descartada**: username/handle ou convite sem busca.
- **Decisão**: Grupos com dono + membros; amizade não é pré-requisito para entrar. **Por quê**: grupos podem reunir pessoas que ainda não são amigas. **Alternativa descartada**: só amigos no grupo ou papéis admin/flat.
- **Decisão**: Qualquer membro convida novos participantes por e-mail; API expõe sugestões entre amigos que ainda não estão no grupo. **Por quê**: facilita crescimento orgânico do grupo sem centralizar convites no dono. **Alternativa descartada**: só dono convida ou link reutilizável.
- **Decisão**: Reutilizar stack e padrões existentes — JWT/auth, Prisma (porta + repositório + mapper), factories Fastify, SPA com refresh silencioso. **Por quê**: consistência com `UserMovieEntry`, conversas e auth. **Alternativa descartada**: módulo social paralelo do zero.
- **Decisão**: Modelagem de banco detalhada por feature via `data_model: on` (subagente propõe schema antes da migração). **Por quê**: o usuário não definiu ainda a forma das tabelas; decisão fica no chunk com código na mão.

## Features (executadas sequencialmente)

1. **friendship** — Persistência e API de amizades: enviar/aceitar/recusar solicitação, listar amigos e buscar usuário por e-mail.
2. **user-groups** — Persistência e API de grupos: criar, listar, convidar por e-mail (qualquer membro), aceitar convite e sugerir amigos ainda fora do grupo.
3. **social-ui** — Telas básicas no SPA para gerenciar amigos, solicitações pendentes e grupos.

## Escopo

**Dentro**: modelos Prisma + migrações; endpoints REST autenticados para amizade e grupos; convite por e-mail; sugestões de amigos para convite; UI mínima no frontend; reúso de auth JWT e convenções de repositório do backend.

**Fora**: watchlist compartilhada do grupo; busca/recomendação excluindo assistidos de todos os membros; username/handle público; papéis admin no grupo; follow unidirecional; notificações push/e-mail transacional; chat ou feed dentro do grupo; limite de tamanho de grupo (salvo validação mínima de sanidade na spec).
