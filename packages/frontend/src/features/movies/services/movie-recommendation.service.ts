import { movieClient } from "@/lib/api/movie-client";
import {
  MovieRecommendationRequestDTO,
  MovieRecommendationResponseDTOSchema,
} from "../dto/movie-recommendation.dto";
import { GuestRemainingUtils } from "../utils/guest-remaining.utils";

export class MovieRecommendationService {
  static async getRecommendations(
    body: MovieRecommendationRequestDTO,
    chatId: string,
  ) {
    const { data, headers } = await movieClient.post(
      "/movie/recommendation",
      body,
      { headers: { chatId } },
    );

    const parsedResponse = MovieRecommendationResponseDTOSchema.parse(data);
    const guestRemaining = GuestRemainingUtils.parseFromHeaders(headers);

    return { ...parsedResponse, guestRemaining };
  }
}
