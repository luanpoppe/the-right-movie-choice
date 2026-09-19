import { readFileSync } from "node:fs";
import path from "node:path";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { Logger } from "@/lib/logger/logger";

const mockExecute = vi.fn();

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock(
  "@/domains/movies/infrastructure/factories/make-seed-movie-query-suggestions-use-case.factory",
  () => ({
    MakeSeedMovieQuerySuggestionsUseCaseFactory: {
      create: () => ({ execute: mockExecute }),
    },
  }),
);

describe("seed-query-suggestions script", () => {
  let exitSpy: MockInstance<typeof process.exit>;

  beforeEach(() => {
    vi.clearAllMocks();
    exitSpy = vi.spyOn(process, "exit").mockImplementation((_code) => {
      return undefined as never;
    });
  });

  afterEach(() => {
    exitSpy.mockRestore();
    vi.resetModules();
  });

  it("REQ-1: db:migrate encadeia seed após migrate no package.json", () => {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["db:migrate"]).toBe(
      "prisma migrate deploy && pnpm seed:query-suggestions",
    );
    expect(packageJson.scripts["db:migrate:dev"]).toBe(
      "prisma migrate dev && pnpm seed:query-suggestions",
    );
    expect(packageJson.scripts["seed:query-suggestions"]).toContain(
      "seed-query-suggestions.ts",
    );
  });

  it("REQ-7: encerra com código 0 quando o seed conclui com sucesso", async () => {
    mockExecute.mockResolvedValue(undefined);

    await import("../seed-query-suggestions.js");

    await vi.waitFor(() => {
      expect(exitSpy).toHaveBeenCalledWith(0);
    });
    expect(mockExecute).toHaveBeenCalledOnce();
  });

  it("REQ-7: encerra com código 1 quando o seed falha", async () => {
    mockExecute.mockRejectedValue(new Error("IA timeout"));

    await import("../seed-query-suggestions.js");

    await vi.waitFor(() => {
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
    expect(Logger.error).toHaveBeenCalledWith(
      "Movie query suggestion seed script failed",
      expect.objectContaining({ error: "IA timeout" }),
    );
  });
});
