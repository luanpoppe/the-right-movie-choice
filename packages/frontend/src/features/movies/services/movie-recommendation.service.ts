import { env } from "@/utils/env";
import axios from "axios";
import {
  MovieRecommendationRequestDTO,
  MovieRecommendationResponseDTO,
} from "../dto/movie-recommendation.dto";
import { MOCK_MESSAGES } from "@/utils/mock-messages";
import { Utils } from "@/utils/utils";

export class MovieRecommendationService {
  private static baseUrl = env.VITE_BACKEND_URL;

  static async getRecommendations(
    body: MovieRecommendationRequestDTO,
    chatId: string
  ) {
    const { data } = await axios.post<MovieRecommendationResponseDTO>(
      `${this.baseUrl}/movie/recommendation`,
      body,
      { headers: { chatId: chatId } }
    );

    return data;
  }
  static async mockGetRecommendations(chatId: string) {
    try {
      const data: MovieRecommendationResponseDTO = {
        movies: MOCK_MESSAGES[1].movies ?? [],
        response: "Resposta da llm",
      };

      await Utils.delay(1.5);

      return data;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
