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

  it("chama ai.memory.getHistory com o chatId quando o thread base tem mensagens", async () => {
    getHistory.mockResolvedValue({
      messages: [MemoryHistoryFixtures.human("oi")],
    });

    await repository.getHistory(chatId);

    expect(getHistory).toHaveBeenCalledTimes(1);
    expect(getHistory).toHaveBeenCalledWith(chatId);
  });

  it("resolve histórico em thread exclude-watched quando o chatId base está vazio", async () => {
    const excludeThreadId = `${chatId}:exclude:1`;
    getHistory.mockImplementation(async (threadId: string) => {
      if (threadId === chatId) {
        return { messages: [] };
      }
      if (threadId === excludeThreadId) {
        return {
          messages: [
            MemoryHistoryFixtures.human("horror movies set in daylight"),
            MemoryHistoryFixtures.ai("Try The Descent"),
          ],
        };
      }
      return { messages: [] };
    });

    const history = await repository.getHistory(chatId);

    expect(history).toEqual([
      ["user", "horror movies set in daylight"],
      ["ai", "Try The Descent"],
    ]);
    expect(getHistory).toHaveBeenCalledWith(chatId);
    expect(getHistory).toHaveBeenCalledWith(`${chatId}:exclude:5`);
    expect(getHistory).toHaveBeenCalledWith(excludeThreadId);
    expect(Logger.debug).toHaveBeenCalledWith(
      "Resolved chat history from derived thread",
      {
        chatId,
        resolvedThreadId: excludeThreadId,
        messageCount: 2,
      },
    );
  });

  it("extrai movies de conteúdo ai em JSON estruturado", async () => {
    const structuredContent = JSON.stringify({
      response: "Try Blade Runner",
      movies: [
        {
          title: "Blade Runner",
          director: "Ridley Scott",
          actors: ["Harrison Ford"],
          releaseYear: 1982,
          streamingPlatform: "Netflix",
          imdbRating: 8.1,
          synopsis: "Neo-noir sci-fi.",
          whySuggestion: "Classic.",
          durationInMinutes: 117,
        },
      ],
    });

    getHistory.mockResolvedValue({
      messages: [MemoryHistoryFixtures.ai(structuredContent)],
    });

    const history = await repository.getHistory(chatId);

    expect(history).toEqual([
      [
        "ai",
        "Try Blade Runner",
        [
          {
            title: "Blade Runner",
            director: "Ridley Scott",
            actors: ["Harrison Ford"],
            releaseYear: 1982,
            streamingPlatform: "Netflix",
            imdbRating: 8.1,
            synopsis: "Neo-noir sci-fi.",
            whySuggestion: "Classic.",
            durationInMinutes: 117,
          },
        ],
      ],
    ]);
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

  it("ignora mensagens ai vazias do fluxo com tool-calling", async () => {
    getHistory.mockResolvedValue({
      messages: [
        MemoryHistoryFixtures.human("horror movies set in daylight"),
        MemoryHistoryFixtures.ai(""),
        MemoryHistoryFixtures.tool("tool-payload"),
        MemoryHistoryFixtures.ai(
          JSON.stringify({
            response: "Try Midsommar",
            movies: [
              {
                title: "Midsommar",
                director: "Ari Aster",
                actors: ["Florence Pugh"],
                releaseYear: 2019,
                streamingPlatform: "Netflix",
                imdbRating: 7.1,
                synopsis: "Synopsis",
                whySuggestion: "Why",
                durationInMinutes: 148,
              },
            ],
          }),
        ),
      ],
    });

    const history = await repository.getHistory(chatId);

    expect(history).toEqual([
      ["user", "horror movies set in daylight"],
      [
        "ai",
        "Try Midsommar",
        [
          {
            title: "Midsommar",
            director: "Ari Aster",
            actors: ["Florence Pugh"],
            releaseYear: 2019,
            streamingPlatform: "Netflix",
            imdbRating: 7.1,
            synopsis: "Synopsis",
            whySuggestion: "Why",
            durationInMinutes: 148,
          },
        ],
      ],
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
