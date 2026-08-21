# Histórico de chat no Redis
> Atualizado em 2026-08-21 · fontes: `core/repositories/chat-history.repository.ts`, `lib/redis`, `GetMovieRecommendationUseCase`

## O que é
Memória de conversa por sessão anônima, para a IA considerar turnos anteriores sem persistir no Postgres e sem usuário logado.

## Como funciona
- Porta: `IChatHistoryRepository` em `core` (compartilhada entre contextos).
- Implementação Redis: `ChatHistoryRedisRepository` (adapter em infrastructure de movies). Cliente em `lib/redis`.
- Identidade: UUID gerado no frontend (`Home` / `crypto.randomUUID()`), enviado no header `chatId` (normalizado para `chatid` no DTO).
- TTL: 20 minutos ao gravar o par user/ai (`tentyMinutesInSeconds` no use case). Reset no UI gera novo UUID.

## Decisões e porquês
- Redis em vez de Postgres — histórico é efêmero e de sessão, não de conta.
- Header em vez de JWT — recomendações são públicas; sessão de chat ≠ sessão de auth.
- Porta no `core` — o contrato não pertence ao domínio de filmes nem ao de usuários.

## Notas
Redis também guarda refresh tokens (domínio auth). São chaves/usos distintos no mesmo serviço Docker.
