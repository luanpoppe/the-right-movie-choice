import { AI, AIMessages } from "@luanpoppe/ai";
import z from "zod";
import { Logger } from "@/lib/logger/logger";
import { AiModels } from "@/lib/ai/ai-models";
import { UserConversationValidationUtils } from "../../domain/user-conversation-validation.utils";
import { WrongMovieSchemaFromLlmException } from "../../domain/exceptions/wrong-movie-schema-from-llm.exception";

const ConversationTitleOutputSchema = z.object({
  title: z.string(),
});

const CONVERSATION_TITLE_SYSTEM_PROMPT = [
  "Generate a short conversation title based on the user's first message.",
  "Use Portuguese or English, matching the language of the user message.",
  "Maximum 200 characters. No quotes. Be concise and descriptive.",
].join(" ");

export class ConversationTitleGenerator {
  constructor(private ai: AI) {}

  async generateFromUserMessage(userMessage: string): Promise<string | null> {
    const startedAtMs = Date.now();
    const modelConfig = { temperature: 0.7 };

    try {
      const result = await this.ai.callStructuredOutput({
        aiModel: AiModels.PRIMARY,
        modelConfig,
        systemPrompt: CONVERSATION_TITLE_SYSTEM_PROMPT,
        messages: [AIMessages.human(userMessage)],
        outputSchema: ConversationTitleOutputSchema as never,
      });

      const parseResult = ConversationTitleOutputSchema.safeParse(
        result.response,
      );
      if (!parseResult.success) {
        throw new WrongMovieSchemaFromLlmException();
      }

      const rawTitle = parseResult.data.title.trim();
      const isEmptyTitle = rawTitle.length === 0;
      if (isEmptyTitle) {
        Logger.debug("Conversation title generation returned empty title");
        return null;
      }

      const validatedTitle = ConversationTitleGenerator.validateTitle(rawTitle);
      if (validatedTitle === null) {
        return null;
      }

      const durationMs = Date.now() - startedAtMs;
      Logger.info("Conversation title generated", {
        model: AiModels.PRIMARY,
        durationMs,
        success: true,
      });
      return validatedTitle;
    } catch (error) {
      const durationMs = Date.now() - startedAtMs;
      const isErrorInstance = error instanceof Error;
      const errorMessage = isErrorInstance ? error.message : String(error);
      Logger.error("Conversation title generation failed", {
        model: AiModels.PRIMARY,
        durationMs,
        success: false,
        error: errorMessage,
      });
      return null;
    }
  }

  private static validateTitle(title: string): string | null {
    try {
      UserConversationValidationUtils.assertValidTitle(title);
      return title;
    } catch {
      Logger.debug("Conversation title generation returned invalid title", {
        titleLength: title.length,
      });
      return null;
    }
  }
}
