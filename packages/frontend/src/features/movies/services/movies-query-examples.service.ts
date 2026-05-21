import { env } from "@/utils/env";
import axios from "axios";
import { Utils } from "@/utils/utils";
import { MoviesQueryExamplesResponseDTO } from "../dto/movies-query-examples.dto";

export class MoviesQueryExamplesService {
  private static baseUrl = env.VITE_BACKEND_URL;

  static async getQueryExamples() {
    const { data } = await axios.get<MoviesQueryExamplesResponseDTO>(
      `${this.baseUrl}/movie/queries`
    );

    return data;
  }
  static async mockGetQueryExamples() {
    try {
      const data: MoviesQueryExamplesResponseDTO = {
        queries: [
          { queryExample: "Exemplo 1" },
          { queryExample: "Exemplo 2" },
          { queryExample: "Exemplo 3" },
        ],
      };

      await Utils.delay(1.5);

      return data;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
