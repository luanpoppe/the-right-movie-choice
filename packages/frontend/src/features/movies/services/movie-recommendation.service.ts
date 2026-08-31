import { movieClient } from "@/lib/api/movie-client";
import {
  MovieRecommendationRequestDTO,
  MovieRecommendationResponseDTO,
} from "../dto/movie-recommendation.dto";
import { GuestRemainingUtils } from "../utils/guest-remaining.utils";

export class MovieRecommendationService {
  static async getRecommendations(
    body: MovieRecommendationRequestDTO,
    chatId: string,
  ) {
    const { data, headers } =
      await movieClient.post<MovieRecommendationResponseDTO>(
        "/movie/recommendation",
        body,
        { headers: { chatId } },
      );

    const guestRemaining = GuestRemainingUtils.parseFromHeaders(headers);

    return { ...data, guestRemaining };
  }
}
