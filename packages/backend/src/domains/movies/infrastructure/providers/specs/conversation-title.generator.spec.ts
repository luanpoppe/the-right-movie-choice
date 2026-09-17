import { describe, it, expect, vi, beforeEach } from "vitest";
import { AI } from "@luanpoppe/ai";
import { Logger } from "@/lib/logger/logger";
import { AiModels } from "@/lib/ai/ai-models";
import { UserConversationConstants } from "@/domains/movies/domain/user-conversation.constants";
import { ConversationTitleGenerator } from "../conversation-title.generator";

vi.mock("@/lib/logger/logger", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

class ConversationTitleGeneratorFixtures {
  static validTitleResponse(title: string) {
    return { response: { title } };
  }
}

describe("ConversationTitleGenerator", () => {
  let callStructuredOutput: ReturnType<typeof vi.fn>;
  let generator: ConversationTitleGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    callStructuredOutput = vi.fn();
    const ai = { callStructuredOutput } as unknown as AI;
    generator = new ConversationTitleGenerator(ai);
  });

  it("REQ-7: retorna título válido gerado pela IA", async () => {
    const expectedTitle = "Filmes de ficção dos anos 90";
    callStructuredOutput.mockResolvedValue(
      ConversationTitleGeneratorFixtures.validTitleResponse(expectedTitle),
    );

    const result = await generator.generateFromUserMessage(
      "Quero filmes de ficção dos anos 90",
    );

    expect(result).toBe(expectedTitle);
    expect(callStructuredOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        aiModel: AiModels.PRIMARY,
        modelConfig: { temperature: 0.7 },
        messages: expect.any(Array),
      }),
    );
    expect(Logger.info).toHaveBeenCalledWith(
      "Conversation title generated",
      expect.objectContaining({ success: true }),
    );
  });

  it("edge: remove espaços nas pontas do título retornado", async () => {
    callStructuredOutput.mockResolvedValue(
      ConversationTitleGeneratorFixtures.validTitleResponse(
        "  Filmes de ação  ",
      ),
    );

    const result = await generator.generateFromUserMessage("filmes de ação");

    expect(result).toBe("Filmes de ação");
  });

  it("edge: título vazio após trim retorna null sem lançar", async () => {
    callStructuredOutput.mockResolvedValue(
      ConversationTitleGeneratorFixtures.validTitleResponse("   "),
    );

    const result = await generator.generateFromUserMessage("qualquer mensagem");

    expect(result).toBeNull();
    expect(Logger.debug).toHaveBeenCalledWith(
      "Conversation title generation returned empty title",
    );
  });

  it("edge: título acima de 200 chars retorna null sem lançar", async () => {
    const longTitle = "a".repeat(UserConversationConstants.MAX_TITLE_LENGTH + 1);
    callStructuredOutput.mockResolvedValue(
      ConversationTitleGeneratorFixtures.validTitleResponse(longTitle),
    );

    const result = await generator.generateFromUserMessage("mensagem longa");

    expect(result).toBeNull();
    expect(Logger.debug).toHaveBeenCalledWith(
      "Conversation title generation returned invalid title",
      expect.objectContaining({
        titleLength: longTitle.length,
      }),
    );
  });

  it("edge: resposta com schema inválido retorna null sem lançar", async () => {
    callStructuredOutput.mockResolvedValue({
      response: { title: 123 },
    });

    const result = await generator.generateFromUserMessage("mensagem");

    expect(result).toBeNull();
    expect(Logger.error).toHaveBeenCalledWith(
      "Conversation title generation failed",
      expect.objectContaining({ success: false }),
    );
  });

  it("REQ-7: falha na chamada de IA retorna null sem lançar", async () => {
    callStructuredOutput.mockRejectedValue(new Error("llm down"));

    const result = await generator.generateFromUserMessage("mensagem");

    expect(result).toBeNull();
    expect(Logger.error).toHaveBeenCalledWith(
      "Conversation title generation failed",
      expect.objectContaining({
        success: false,
        error: "llm down",
      }),
    );
  });
});
