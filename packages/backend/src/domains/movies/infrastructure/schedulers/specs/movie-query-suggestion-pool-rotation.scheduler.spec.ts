import { describe, it, expect, vi, beforeEach } from "vitest";
import { Logger } from "@/lib/logger/logger";

const { envState, scheduleMock, createMock, executeMock } = vi.hoisted(() => ({
  envState: { NODE_ENV: "dev" as "dev" | "prod" | "test" },
  scheduleMock: vi.fn(),
  createMock: vi.fn(),
  executeMock: vi.fn(),
}));

vi.mock("@/env", () => ({
  env: {
    get NODE_ENV() {
      return envState.NODE_ENV;
    },
  },
}));

vi.mock("node-cron", () => ({
  default: {
    schedule: scheduleMock,
  },
}));

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock(
  "@/domains/movies/infrastructure/factories/make-rotate-movie-query-suggestions-use-case.factory",
  () => ({
    MakeRotateMovieQuerySuggestionsUseCaseFactory: {
      create: createMock,
    },
  }),
);

import { MovieQuerySuggestionPoolRotationScheduler } from "../movie-query-suggestion-pool-rotation.scheduler";

function runScheduledJobCallback(): void {
  const scheduleCall = scheduleMock.mock.calls[0];
  expect(scheduleCall).toBeDefined();

  const jobCallback = scheduleCall![1];
  expect(typeof jobCallback).toBe("function");

  const run = jobCallback as () => void;
  run();
}

describe("MovieQuerySuggestionPoolRotationScheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envState.NODE_ENV = "dev";
    executeMock.mockResolvedValue(undefined);
    createMock.mockReturnValue({ execute: executeMock });
    scheduleMock.mockReturnValue({ stop: vi.fn() });
  });

  it("não agenda o cron quando NODE_ENV não é prod", () => {
    envState.NODE_ENV = "dev";

    const result = MovieQuerySuggestionPoolRotationScheduler.start();

    expect(result).toBeNull();
    expect(scheduleMock).not.toHaveBeenCalled();
  });

  it("não agenda o cron quando NODE_ENV é test", () => {
    envState.NODE_ENV = "test";

    const result = MovieQuerySuggestionPoolRotationScheduler.start();

    expect(result).toBeNull();
    expect(scheduleMock).not.toHaveBeenCalled();
  });

  it("retorna null e loga warn quando cron.schedule falha ao registrar", () => {
    envState.NODE_ENV = "prod";
    scheduleMock.mockImplementation(() => {
      throw new Error("invalid cron expression");
    });

    const result = MovieQuerySuggestionPoolRotationScheduler.start();

    expect(result).toBeNull();
    expect(Logger.warn).toHaveBeenCalledWith(
      "Movie query suggestion pool rotation scheduler failed to register, HTTP will continue without weekly rotation",
      { reason: "invalid cron expression" },
    );
  });

  it("agenda o cron com expressão e timezone corretos em prod", () => {
    envState.NODE_ENV = "prod";
    const scheduledTask = { stop: vi.fn() };
    scheduleMock.mockReturnValue(scheduledTask);

    const result = MovieQuerySuggestionPoolRotationScheduler.start();

    expect(result).toBe(scheduledTask);
    expect(scheduleMock).toHaveBeenCalledWith(
      "0 3 * * 0",
      expect.any(Function),
      { timezone: "America/Sao_Paulo" },
    );
  });

  it("callback do job chama factory.create() e useCase.execute()", async () => {
    envState.NODE_ENV = "prod";
    MovieQuerySuggestionPoolRotationScheduler.start();

    runScheduledJobCallback();

    await vi.waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
      expect(executeMock).toHaveBeenCalledTimes(1);
    });
  });

  it("loga no início da execução do job de rotação", async () => {
    envState.NODE_ENV = "prod";
    MovieQuerySuggestionPoolRotationScheduler.start();

    runScheduledJobCallback();

    await vi.waitFor(() => {
      expect(Logger.info).toHaveBeenCalledWith(
        "Movie query suggestion pool rotation job started",
      );
    });
  });

  it("captura erro em execute, loga e não relança", async () => {
    envState.NODE_ENV = "prod";
    executeMock.mockRejectedValue(new Error("falha na rotação"));
    MovieQuerySuggestionPoolRotationScheduler.start();

    runScheduledJobCallback();

    await vi.waitFor(() => {
      expect(Logger.error).toHaveBeenCalledWith(
        "Movie query suggestion pool rotation job failed",
        { reason: "falha na rotação" },
      );
    });
  });
});
