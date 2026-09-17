import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { AIMemory } from "@luanpoppe/ai";
import { MovieRecommendationPostgresMemory } from "@/lib/ai/movie-recommendation-postgres-memory";
import { Logger } from "@/lib/logger/logger";
import { UserConversationValidationException } from "@/domains/movies/domain/exceptions/user-conversation-validation.exception";
import { PostgresChatThreadRepository } from "../postgres-chat-thread.repository";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/lib/ai/movie-recommendation-postgres-memory", () => ({
  MovieRecommendationPostgresMemory: {
    getShared: vi.fn(),
    resetForTests: vi.fn(),
  },
}));

describe("PostgresChatThreadRepository", () => {
  const validChatId = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";
  let deleteThread: ReturnType<typeof vi.fn>;
  let getCheckpointer: ReturnType<typeof vi.fn>;
  let repository: PostgresChatThreadRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    deleteThread = vi.fn().mockResolvedValue(undefined);
    getCheckpointer = vi.fn().mockResolvedValue({ deleteThread });
    vi.mocked(MovieRecommendationPostgresMemory.getShared).mockReturnValue({
      getCheckpointer,
    } as unknown as AIMemory);
    repository = new PostgresChatThreadRepository();
  });

  it("rejeita chatId inválido antes do checkpointer", async () => {
    await expect(repository.deleteThread("not-a-uuid")).rejects.toThrow(
      UserConversationValidationException,
    );

    expect(MovieRecommendationPostgresMemory.getShared).not.toHaveBeenCalled();
    expect(getCheckpointer).not.toHaveBeenCalled();
    expect(deleteThread).not.toHaveBeenCalled();
  });

  it("apaga thread base e threads exclude-watched derivados", async () => {
    await repository.deleteThread(validChatId);

    expect(MovieRecommendationPostgresMemory.getShared).toHaveBeenCalledTimes(1);
    expect(getCheckpointer).toHaveBeenCalledTimes(1);
    expect(deleteThread).toHaveBeenCalledTimes(6);
    expect(deleteThread).toHaveBeenNthCalledWith(1, validChatId);
    expect(deleteThread).toHaveBeenNthCalledWith(2, `${validChatId}:exclude:1`);
    expect(deleteThread).toHaveBeenNthCalledWith(6, `${validChatId}:exclude:5`);
  });

  it("loga debug antes e info após purge bem-sucedida", async () => {
    await repository.deleteThread(validChatId);

    expect(Logger.debug).toHaveBeenCalledWith(
      "Deleting chat thread from checkpointer",
      { chatId: validChatId },
    );
    expect(Logger.info).toHaveBeenCalledWith(
      "Chat thread deleted from checkpointer",
      { chatId: validChatId, deletedThreadCount: 6 },
    );
  });

  it("propaga erro e loga quando deleteThread do checkpointer falha", async () => {
    const purgeError = new Error("checkpointer unavailable");
    deleteThread.mockRejectedValue(purgeError);

    await expect(repository.deleteThread(validChatId)).rejects.toThrow(
      "checkpointer unavailable",
    );

    expect(Logger.error).toHaveBeenCalledWith(
      "Failed to delete chat thread from checkpointer",
      { chatId: validChatId, reason: "checkpointer unavailable" },
    );
    expect(Logger.info).not.toHaveBeenCalled();
  });

  it("porta expõe somente deleteThread", () => {
    const portaPath = path.join(
      process.cwd(),
      "src/domains/movies/domain/repositories/chat-thread.repository.ts",
    );
    const portaSource = readFileSync(portaPath, "utf8");

    expect(portaSource).toMatch(/deleteThread/);
    expect(portaSource).not.toMatch(/getHistory/);
    expect(portaSource).not.toMatch(/create\(/);
  });
});
