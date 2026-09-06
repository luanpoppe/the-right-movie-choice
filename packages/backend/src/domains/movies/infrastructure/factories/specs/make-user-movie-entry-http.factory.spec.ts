import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

vi.mock("@/env", () => ({
  env: {
    JWT_SECRET: "test-jwt-secret-for-factory-spec",
    JWT_ACCESS_EXPIRES_IN: "15m",
  },
}));

vi.mock("@/lib/prisma/prisma", () => ({
  prisma: {
    userMovieEntry: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { MakeUserMovieEntryHttpFactory } from "../make-user-movie-entry-http.factory";

describe("MakeUserMovieEntryHttpFactory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna preHandler e handlers prontos para registrar nas rotas", () => {
    const http = MakeUserMovieEntryHttpFactory.create();

    expect(typeof http.preHandler).toBe("function");
    expect(typeof http.handlers.list).toBe("function");
    expect(typeof http.handlers.getByTmdbId).toBe("function");
    expect(typeof http.handlers.patch).toBe("function");
  });

  it("compõe preHandler async e handlers callable", async () => {
    const http = MakeUserMovieEntryHttpFactory.create();

    await expect(http.preHandler({ headers: {} } as never)).rejects.toThrow();
    expect(http.handlers.list).toBeTypeOf("function");
    expect(http.handlers.getByTmdbId).toBeTypeOf("function");
    expect(http.handlers.patch).toBeTypeOf("function");
  });

  it("factory declara dependências esperadas no código-fonte", () => {
    const factoryPath = path.join(
      process.cwd(),
      "src/domains/movies/infrastructure/factories/make-user-movie-entry-http.factory.ts",
    );
    const factorySource = readFileSync(factoryPath, "utf8");

    expect(factorySource).toMatch(/new JoseAccessTokenProvider\(\)/);
    expect(factorySource).toMatch(/new PrismaUserMovieEntryRepository\(\)/);
    expect(factorySource).toMatch(/new ListUserMovieEntriesUseCase\(/);
    expect(factorySource).toMatch(/new GetUserMovieEntryUseCase\(/);
    expect(factorySource).toMatch(/new UpsertUserMovieEntryUseCase\(/);
    expect(factorySource).toMatch(/UserMovieEntryAuthHook\.createPreHandler/);
    expect(factorySource).toMatch(/UserMovieEntryController\.create\(/);
  });

  it("create() produz instâncias reais dos use cases", () => {
    const http = MakeUserMovieEntryHttpFactory.create();

    expect(http.handlers.list).toBeTypeOf("function");
    expect(http.handlers.getByTmdbId).toBeTypeOf("function");
    expect(http.handlers.patch).toBeTypeOf("function");
    expect(http.preHandler).toBeTypeOf("function");
  });
});
