import cron from "node-cron";
import type { ScheduledTask } from "node-cron";

import { PopularMoviesConstants } from "@/domains/movies/domain/popular-movies.constants";
import { MakePopularMoviesHttpFactory } from "@/domains/movies/infrastructure/factories/make-popular-movies-http.factory";
import { env } from "@/env";
import { Logger } from "@/lib/logger/logger";
import { ErrorUtils } from "@/shared/utils/error.utils";

export class PopularMoviesRefreshScheduler {
  static start(): ScheduledTask | null {
    const isProd = env.NODE_ENV === "prod";
    if (!isProd) {
      return null;
    }

    try {
      const task = cron.schedule(
        "0 4 * * *", // Every day at 4:00 AM
        () => {
          void PopularMoviesRefreshScheduler.runRefreshJob();
        },
        {
          timezone: "America/Sao_Paulo",
        },
      );

      return task;
    } catch (error) {
      const reason = ErrorUtils.message(error);
      Logger.warn(
        "Popular movies refresh scheduler failed to register, HTTP will still serve on-demand",
        { reason },
      );
      return null;
    }
  }

  private static async runRefreshJob(): Promise<void> {
    try {
      Logger.info("Popular movies refresh job started");

      const { getPopularMoviesUseCase } = MakePopularMoviesHttpFactory.create();
      const movies = await getPopularMoviesUseCase.refresh({
        language: PopularMoviesConstants.DEFAULT_LANGUAGE,
      });

      Logger.info("Popular movies refresh job finished", {
        count: movies.length,
      });
    } catch (error) {
      const reason = ErrorUtils.message(error);
      Logger.error("Popular movies refresh job failed", { reason });
    }
  }
}
