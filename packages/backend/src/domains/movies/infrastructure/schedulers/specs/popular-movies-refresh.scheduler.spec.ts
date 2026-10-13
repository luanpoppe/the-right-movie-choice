import { describe, it, expect, vi, beforeEach } from "vitest";
import { Logger } from "@/lib/logger/logger";

const { envState, scheduleMock, createMock, refreshMock } = vi.hoisted(() => ({
  envState: { NODE_ENV: "dev" as "dev" | "prod" | "test" },
  scheduleMock: vi.fn(),
  createMock: vi.fn(),
  refreshMock: vi.fn(),
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
  "@/domains/movies/infrastructure/factories/make-popular-movies-http.factory",
  () => ({
    MakePopularMoviesHttpFactory: {
      create: createMock,
    },
  }),
);

import { PopularMoviesRefreshScheduler } from "../popular-movies-refresh.scheduler";

function runScheduledJobCallback(): void {
  const scheduleCall = scheduleMock.mock.calls[0];
  expect(scheduleCall).toBeDefined();

  const jobCallback = scheduleCall![1];
  expect(typeof jobCallback).toBe("function");

  const run = jobCallback as () => void;
  run();
}

describe("PopularMoviesRefreshScheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envState.NODE_ENV = "dev";
    refreshMock.mockResolvedValue([]);
    createMock.mockReturnValue({ getPopularMoviesUseCase: { refresh: refreshMock } });
    scheduleMock.mockReturnValue({ stop: vi.fn() });
  });

  it("não agenda o cron quando NODE_ENV não é prod", () => {
    envState.NODE_ENV = "dev";

    const result = PopularMoviesRefreshScheduler.start();

    expect(result).toBeNull();
    expect(scheduleMock).not.toHaveBeenCalled();
  });

  it("não agenda o cron quando NODE_ENV é test", () => {
    envState.NODE_ENV = "test";

    const result = PopularMoviesRefreshScheduler.start();

    expect(result).toBeNull();
    expect(scheduleMock).not.toHaveBeenCalled();
  });

  it("agenda diariamente às 04:00 em São Paulo quando em prod", () => {
    envState.NODE_ENV = "prod";
    const scheduledTask = { stop: vi.fn() };
    scheduleMock.mockReturnValue(scheduledTask);

    const result = PopularMoviesRefreshScheduler.start();

    expect(result).toBe(scheduledTask);
    expect(scheduleMock).toHaveBeenCalledWith(
      "0 4 * * *",
      expect.any(Function),
      { timezone: "America/Sao_Paulo" },
    );
  });

  it("callback do job chama factory.create() e useCase.refresh()", async () => {
    envState.NODE_ENV = "prod";
    PopularMoviesRefreshScheduler.start();

    runScheduledJobCallback();

    await vi.waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });

  it("captura erro no refresh, loga e não relança", async () => {
    envState.NODE_ENV = "prod";
    refreshMock.mockRejectedValue(new Error("falha no refresh"));
    PopularMoviesRefreshScheduler.start();

    runScheduledJobCallback();

    await vi.waitFor(() => {
      expect(Logger.error).toHaveBeenCalledWith(
        "Popular movies refresh job failed",
        { reason: "falha no refresh" },
      );
    });
  });
});
