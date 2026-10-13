import { movieClient } from "@/lib/api/movie-client";
import {
  PopularMoviesResponse,
  PopularMoviesResponseSchema,
} from "../dto/popular-movies.dto";

export class PopularMoviesService {
  static async getPopularMovies(): Promise<PopularMoviesResponse> {
    const { data } = await movieClient.get("/movie/popular");
    const parsedResponse = PopularMoviesResponseSchema.parse(data);

    return parsedResponse;
  }
}
