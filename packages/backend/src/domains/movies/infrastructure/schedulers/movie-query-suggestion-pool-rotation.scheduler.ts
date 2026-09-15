import cron from "node-cron";
import type { ScheduledTask } from "node-cron";

import { MakeRotateMovieQuerySuggestionsUseCaseFactory } from "@/domains/movies/infrastructure/factories/make-rotate-movie-query-suggestions-use-case.factory";
import { env } from "@/env";
import { Logger } from "@/lib/logger/logger";
import { ErrorUtils } from "@/shared/utils/error.utils";

export class MovieQuerySuggestionPoolRotationScheduler {
  static start(): ScheduledTask | null {
    const isProd = env.NODE_ENV === "prod";
    if (!isProd) {
      return null;
    }

    try {
      const task = cron.schedule(
        "0 3 * * 0", // Every Sunday at 3:00 AM
        () => {
          void MovieQuerySuggestionPoolRotationScheduler.runRotationJob();
        },
        {
          timezone: "America/Sao_Paulo",
        },
      );

      return task;
    } catch (error) {
      const reason = ErrorUtils.message(error);
      Logger.warn(
        "Movie query suggestion pool rotation scheduler failed to register, HTTP will continue without weekly rotation",
        { reason },
      );
      return null;
    }
  }

  private static async runRotationJob(): Promise<void> {
    try {
      Logger.info("Movie query suggestion pool rotation job started");

      const useCase = MakeRotateMovieQuerySuggestionsUseCaseFactory.create();
      await useCase.execute();
    } catch (error) {
      const reason = ErrorUtils.message(error);
      Logger.error("Movie query suggestion pool rotation job failed", {
        reason,
      });
    }
  }
}
