import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AI } from "@luanpoppe/ai";
import { Logger } from "@/lib/logger/logger";
import { ChatHistoryAiMemoryRepository } from "../chat-history-ai-memory.repository";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

class MemoryHistoryFixtures {
  static human(content: string) {
    return { role: "human" as const, content };
  }

  static ai(content: string) {
    return { role: "ai" as const, content };
  }

  static tool(content: string) {
    return { role: "tool" as const, content };
  }
}

describe("ChatHistoryAiMemoryRepository", () => {
  const chatId = "chat-abc";
  let getHistory: ReturnType<typeof vi.fn>;
  let repository: ChatHistoryAiMemoryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    getHistory = vi.fn();
    const ai = { memory: { getHistory } } as unknown as AI;
    repository = new ChatHistoryAiMemoryRepository(ai);
  });

  it("chama ai.memory.getHistory com o chatId", async () => {
    getHistory.mockResolvedValue({ messages: [] });

    await repository.getHistory(chatId);

    expect(getHistory).toHaveBeenCalledTimes(1);
    expect(getHistory).toHaveBeenCalledWith(chatId);
  });

  it("mapeia human para user e ai para ai", async () => {
    getHistory.mockResolvedValue({
      messages: [
        MemoryHistoryFixtures.human("oi"),
        MemoryHistoryFixtures.ai("olá"),
      ],
    });

    const history = await repository.getHistory(chatId);

    expect(history).toEqual([
      ["user", "oi"],
      ["ai", "olá"],
    ]);
  });

  it("ignora mensagens com role tool", async () => {
    getHistory.mockResolvedValue({
      messages: [
        MemoryHistoryFixtures.human("pergunta"),
        MemoryHistoryFixtures.tool("tool-payload"),
        MemoryHistoryFixtures.ai("resposta"),
        MemoryHistoryFixtures.tool("outro-tool"),
      ],
    });

    const history = await repository.getHistory(chatId);

    expect(history).toEqual([
      ["user", "pergunta"],
      ["ai", "resposta"],
    ]);
  });

  it("devolve lista vazia quando a memória não tem mensagens", async () => {
    getHistory.mockResolvedValue({ messages: [] });

    const history = await repository.getHistory(chatId);

    expect(history).toEqual([]);
  });

  it("lança e loga quando o role da memória é desconhecido", async () => {
    getHistory.mockResolvedValue({
      messages: [{ role: "system", content: "não suportado" }],
    });

    await expect(repository.getHistory(chatId)).rejects.toThrow(
      "Unknown chat history memory role: system",
    );
    expect(Logger.error).toHaveBeenCalledWith("Unknown chat history memory role", {
      chatId,
      role: "system",
    });
  });

  it("não expõe addMessage na instância nem na porta", () => {
    const instanceRecord = repository as unknown as Record<string, unknown>;
    const portaPath = path.join(
      process.cwd(),
      "src/core/repositories/chat-history.repository.ts",
    );
    const portaSource = readFileSync(portaPath, "utf8");

    expect(instanceRecord.addMessage).toBeUndefined();
    expect("addMessage" in repository).toBe(false);
    expect(portaSource).not.toMatch(/addMessage/);
    expect(portaSource).toMatch(/getHistory/);
  });

  it("não reutiliza ChatHistoryAiMessagesUtils no adapter", () => {
    const adapterPath = path.join(
      process.cwd(),
      "src/infrastructure/repositories/chat-history-ai-memory.repository.ts",
    );
    const adapterSource = readFileSync(adapterPath, "utf8");

    expect(adapterSource).not.toMatch(/ChatHistoryAiMessagesUtils/);
  });
});
