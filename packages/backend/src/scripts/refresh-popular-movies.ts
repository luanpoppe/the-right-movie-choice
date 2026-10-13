import { Logger } from "@/lib/logger/logger";
import { PopularMoviesConstants } from "@/domains/movies/domain/popular-movies.constants";
import { MakePopularMoviesHttpFactory } from "@/domains/movies/infrastructure/factories/make-popular-movies-http.factory";

async function main() {
  const { getPopularMoviesUseCase } = MakePopularMoviesHttpFactory.create();
  const movies = await getPopularMoviesUseCase.refresh({
    language: PopularMoviesConstants.DEFAULT_LANGUAGE,
  });

  Logger.info("Popular movies cache refreshed", {
    count: movies.length,
    language: PopularMoviesConstants.DEFAULT_LANGUAGE,
  });

  process.exit(0);
}

main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  Logger.error("Popular movies refresh script failed", {
    error: errorMessage,
  });
  process.exit(1);
});
