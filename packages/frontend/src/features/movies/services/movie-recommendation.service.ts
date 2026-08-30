import { movieClient } from "@/lib/api/movie-client";
import {
  MovieRecommendationRequestDTO,
  MovieRecommendationResponseDTO,
} from "../dto/movie-recommendation.dto";

export class MovieRecommendationService {
  static async getRecommendations(
    body: MovieRecommendationRequestDTO,
    chatId: string,
  ) {
    const { data } = await movieClient.post<MovieRecommendationResponseDTO>(
      "/movie/recommendation",
      body,
      { headers: { chatId } },
    );

    return data;
  }
}
