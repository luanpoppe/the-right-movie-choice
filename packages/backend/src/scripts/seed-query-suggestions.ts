import { Logger } from "@/lib/logger/logger";
import { MakeSeedMovieQuerySuggestionsUseCaseFactory } from "@/domains/movies/infrastructure/factories/make-seed-movie-query-suggestions-use-case.factory";

async function main() {
  const useCase = MakeSeedMovieQuerySuggestionsUseCaseFactory.create();
  await useCase.execute();
  process.exit(0);
}

main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  Logger.error("Movie query suggestion seed script failed", {
    error: errorMessage,
  });
  process.exit(1);
});
