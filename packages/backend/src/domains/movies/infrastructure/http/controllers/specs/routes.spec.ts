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
const userConversationPreHandler = vi.fn();
const userConversationHandlers = {
  create: vi.fn(),
  list: vi.fn(),
  getById: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
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

vi.mock("../../../factories/make-user-conversation-http.factory", () => ({
  MakeUserConversationHttpFactory: {
    create: vi.fn(() => ({
      preHandler: userConversationPreHandler,
      handlers: userConversationHandlers,
    })),
  },
}));

import { MakeUserConversationHttpFactory } from "../../../factories/make-user-conversation-http.factory";
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
      delete: vi.fn(),
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

  it("registra rotas /movie/conversations com preHandler e handlers da factory", async () => {
    await moviesControllers(app);

    expect(MakeUserConversationHttpFactory.create).toHaveBeenCalledTimes(1);

    expect(app.post).toHaveBeenCalledWith(
      "/movie/conversations",
      expect.objectContaining({
        preHandler: userConversationPreHandler,
      }),
      userConversationHandlers.create,
    );

    expect(app.get).toHaveBeenCalledWith(
      "/movie/conversations",
      expect.objectContaining({
        preHandler: userConversationPreHandler,
      }),
      userConversationHandlers.list,
    );

    expect(app.get).toHaveBeenCalledWith(
      "/movie/conversations/:id",
      expect.objectContaining({
        preHandler: userConversationPreHandler,
      }),
      userConversationHandlers.getById,
    );

    expect(app.patch).toHaveBeenCalledWith(
      "/movie/conversations/:id",
      expect.objectContaining({
        preHandler: userConversationPreHandler,
      }),
      userConversationHandlers.patch,
    );

    expect(app.delete).toHaveBeenCalledWith(
      "/movie/conversations/:id",
      expect.objectContaining({
        preHandler: userConversationPreHandler,
      }),
      userConversationHandlers.delete,
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

  it("routes.ts referencia docs e factory de user-conversation no código-fonte", () => {
    const routesPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/http/controllers/routes.ts",
    );
    const routesSource = readFileSync(routesPath, "utf8");

    expect(routesSource).toMatch(/MakeUserConversationHttpFactory\.create\(\)/);
    expect(routesSource).toMatch(/UserConversationCreateDocs/);
    expect(routesSource).toMatch(/UserConversationListDocs/);
    expect(routesSource).toMatch(/UserConversationGetDocs/);
    expect(routesSource).toMatch(/UserConversationPatchDocs/);
    expect(routesSource).toMatch(/UserConversationDeleteDocs/);
    expect(routesSource).toMatch(/userConversationHttp\.preHandler/);
    expect(routesSource).toMatch(/userConversationHttp\.handlers\.create/);
    expect(routesSource).toMatch(/userConversationHttp\.handlers\.list/);
    expect(routesSource).toMatch(/userConversationHttp\.handlers\.getById/);
    expect(routesSource).toMatch(/userConversationHttp\.handlers\.patch/);
    expect(routesSource).toMatch(/userConversationHttp\.handlers\.delete/);
  });
});
