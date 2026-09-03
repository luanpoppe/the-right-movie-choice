import { AIMessages, type AICallParams } from "@luanpoppe/ai";
import { ChatHistoryEntity } from "@/core/entities/chat-history.entity";

type AiSdkMessage = AICallParams["messages"][number];

export class ChatHistoryAiMessagesUtils {
  static toAiMessages(chatHistory: ChatHistoryEntity): AiSdkMessage[] {
    return chatHistory.map((tuple) => {
      const role = tuple[0];
      const content = tuple[1];
      return ChatHistoryAiMessagesUtils.fromRole(role, content);
    });
  }

  private static fromRole(role: string, content: string): AiSdkMessage {
    if (role === "system") {
      return AIMessages.system(content);
    }
    if (role === "user") {
      return AIMessages.human(content);
    }
    if (role === "ai") {
      return AIMessages.ai(content);
    }

    throw new Error(`Unknown chat history role: ${role}`);
  }
}
