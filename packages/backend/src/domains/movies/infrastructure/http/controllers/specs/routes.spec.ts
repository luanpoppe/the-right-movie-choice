import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { FastifyInstance } from "fastify";

const userMovieEntryPreHandler = vi.fn();
const userMovieEntryHandlers = {
  list: vi.fn(),
  getByTmdbId: vi.fn(),
  patch: vi.fn(),
};
const recommendationPreHandler = vi.fn();
const recommendationController = vi.fn();

vi.mock("../../../factories/make-movie-recommendation-http.factory", () => ({
  MakeMovieRecommendationHttpFactory: {
    create: vi.fn(() => ({
      preHandler: recommendationPreHandler,
      controller: recommendationController,
    })),
  },
}));

vi.mock("../../../factories/make-user-movie-entry-http.factory", () => ({
  MakeUserMovieEntryHttpFactory: {
    create: vi.fn(() => ({
      preHandler: userMovieEntryPreHandler,
      handlers: userMovieEntryHandlers,
    })),
  },
}));

import { MakeUserMovieEntryHttpFactory } from "../../../factories/make-user-movie-entry-http.factory";
import { moviesControllers } from "../routes";

describe("moviesControllers routes", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    app = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    } as unknown as FastifyInstance;
  });

  it("registra GET/PATCH /movie/user-entries com preHandler e handlers da factory", async () => {
    await moviesControllers(app);

    expect(MakeUserMovieEntryHttpFactory.create).toHaveBeenCalledTimes(1);

    expect(app.get).toHaveBeenCalledWith(
      "/movie/user-entries",
      expect.objectContaining({
        preHandler: userMovieEntryPreHandler,
      }),
      userMovieEntryHandlers.list,
    );

    expect(app.get).toHaveBeenCalledWith(
      "/movie/user-entries/:tmdbId",
      expect.objectContaining({
        preHandler: userMovieEntryPreHandler,
      }),
      userMovieEntryHandlers.getByTmdbId,
    );

    expect(app.patch).toHaveBeenCalledWith(
      "/movie/user-entries/:tmdbId",
      expect.objectContaining({
        preHandler: userMovieEntryPreHandler,
      }),
      userMovieEntryHandlers.patch,
    );
  });

  it("routes.ts referencia docs e factory de user-movie-entry no código-fonte", () => {
    const routesPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/http/controllers/routes.ts",
    );
    const routesSource = readFileSync(routesPath, "utf8");

    expect(routesSource).toMatch(/MakeUserMovieEntryHttpFactory\.create\(\)/);
    expect(routesSource).toMatch(/UserMovieEntryListDocs/);
    expect(routesSource).toMatch(/UserMovieEntryGetDocs/);
    expect(routesSource).toMatch(/UserMovieEntryPatchDocs/);
    expect(routesSource).toMatch(/userMovieEntryHttp\.preHandler/);
    expect(routesSource).toMatch(/userMovieEntryHttp\.handlers\.list/);
    expect(routesSource).toMatch(/userMovieEntryHttp\.handlers\.getByTmdbId/);
    expect(routesSource).toMatch(/userMovieEntryHttp\.handlers\.patch/);
  });
});
