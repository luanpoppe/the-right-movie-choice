import {
  MovieRecommendationEntity,
  MovieRecommendationLlmSchema,
} from "@/domains/movies/domain/entities/movie-recommendation.entity";

export type ParsedAiHistoryContent = {
  message: string;
  movies?: MovieRecommendationEntity["movies"];
};

export class ChatHistoryStructuredContentUtils {
  static parseAiContent(content: string): ParsedAiHistoryContent {
    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(content);
    } catch {
      return { message: content };
    }

    const parseResult = MovieRecommendationLlmSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      return { message: content };
    }

    const recommendation = parseResult.data;
    const parsedContent: ParsedAiHistoryContent = {
      message: recommendation.response,
      movies: recommendation.movies,
    };
    return parsedContent;
  }
}
