import { describe, expect, it } from "vitest";
import { AIMessages } from "@luanpoppe/ai";
import { ChatHistoryEntity } from "@/core/entities/chat-history.entity";
import { ChatHistoryAiMessagesUtils } from "../chat-history-ai-messages.utils";

describe("ChatHistoryAiMessagesUtils", () => {
  it("returns only the mapped history without injecting a human message", () => {
    const chatHistory: ChatHistoryEntity = [];

    const mappedMessages = ChatHistoryAiMessagesUtils.toAiMessages(chatHistory);

    expect(mappedMessages).toEqual([]);
  });

  it.each([
    {
      role: "system" as const,
      content: "system content",
      expected: AIMessages.system("system content"),
    },
    {
      role: "user" as const,
      content: "user content",
      expected: AIMessages.human("user content"),
    },
    {
      role: "ai" as const,
      content: "ai content",
      expected: AIMessages.ai("ai content"),
    },
  ])("maps role $role to the matching AIMessages factory", ({ role, content, expected }) => {
    const chatHistory: ChatHistoryEntity = [[role, content]];

    const mappedMessages = ChatHistoryAiMessagesUtils.toAiMessages(chatHistory);

    expect(mappedMessages).toEqual([expected]);
  });

  it("throws when the history role is unknown", () => {
    const chatHistory = [["tool", "payload"]] as unknown as ChatHistoryEntity;

    expect(() => ChatHistoryAiMessagesUtils.toAiMessages(chatHistory)).toThrow(
      "Unknown chat history role: tool",
    );
  });
});
