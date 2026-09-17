import { ExcludeWatchedRecommendationConstants } from "@/domains/movies/domain/exclude-watched-recommendation.constants";

export class ChatHistoryThreadIdUtils {
  static buildExcludeRoundThreadId(chatId: string, round: number): string {
    return `${chatId}:exclude:${round}`;
  }

  static buildDeletionThreadIds(chatId: string): string[] {
    const threadIds = [chatId];
    const maxRounds = ExcludeWatchedRecommendationConstants.MAX_EXCLUDE_ROUNDS;

    for (let round = 1; round <= maxRounds; round++) {
      const excludeThreadId = ChatHistoryThreadIdUtils.buildExcludeRoundThreadId(
        chatId,
        round,
      );
      threadIds.push(excludeThreadId);
    }

    return threadIds;
  }

  static buildReadCandidateThreadIds(chatId: string): string[] {
    const candidates = [chatId];
    const maxRounds = ExcludeWatchedRecommendationConstants.MAX_EXCLUDE_ROUNDS;

    for (let round = maxRounds; round >= 1; round--) {
      const excludeThreadId = ChatHistoryThreadIdUtils.buildExcludeRoundThreadId(
        chatId,
        round,
      );
      candidates.push(excludeThreadId);
    }

    return candidates;
  }
}
