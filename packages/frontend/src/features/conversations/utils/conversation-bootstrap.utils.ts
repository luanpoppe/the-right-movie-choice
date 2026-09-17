import { ChatEntity } from "@/features/chat/entities/chat.entity";
import { MovieRecommendationEntity } from "@/features/movies/entities/movie-recommendation.entity";

export type ConversationBootstrapState = {
  response: string;
  movies: MovieRecommendationEntity;
};

export class ConversationBootstrapUtils {
  private static findLastAiMessageIndex(messages: ChatEntity): number {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      const isAiMessage = message.from === "ai";
      if (isAiMessage) {
        return index;
      }
    }

    return -1;
  }

  static readFromLocationState(
    state: unknown,
  ): ConversationBootstrapState | null {
    if (state === null || typeof state !== "object") {
      return null;
    }

    const bootstrap = (state as { conversationBootstrap?: unknown })
      .conversationBootstrap;
    if (bootstrap === null || typeof bootstrap !== "object") {
      return null;
    }

    const response = (bootstrap as { response?: unknown }).response;
    const movies = (bootstrap as { movies?: unknown }).movies;
    const hasValidResponse = typeof response === "string" && response.length > 0;
    const hasValidMovies = Array.isArray(movies);

    if (!hasValidResponse || !hasValidMovies) {
      return null;
    }

    return {
      response,
      movies: movies as MovieRecommendationEntity,
    };
  }

  static enrichMessagesWithBootstrap(
    messages: ChatEntity,
    bootstrap: ConversationBootstrapState | null,
  ): ChatEntity {
    if (!bootstrap) {
      return messages;
    }

    const lastAiMessageIndex =
      ConversationBootstrapUtils.findLastAiMessageIndex(messages);
    if (lastAiMessageIndex < 0) {
      return messages;
    }

    const lastAiMessage = messages[lastAiMessageIndex];
    const alreadyHasMovies =
      lastAiMessage.movies !== undefined && lastAiMessage.movies.length > 0;
    if (alreadyHasMovies) {
      return messages;
    }

    const responseMatches = lastAiMessage.message === bootstrap.response;
    if (!responseMatches) {
      return messages;
    }

    const enrichedMessages = [...messages];
    enrichedMessages[lastAiMessageIndex] = {
      ...lastAiMessage,
      movies: bootstrap.movies,
    };
    return enrichedMessages;
  }
}
