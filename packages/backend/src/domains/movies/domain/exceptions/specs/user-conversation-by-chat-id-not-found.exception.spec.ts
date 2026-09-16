import { describe, expect, it } from "vitest";
import { UserConversationByChatIdNotFoundException } from "../user-conversation-by-chat-id-not-found.exception";

describe("UserConversationByChatIdNotFoundException", () => {
  it("REQ-6: expõe status 404 e inclui chatId na mensagem", () => {
    const chatId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const exception = new UserConversationByChatIdNotFoundException(chatId);

    expect(exception.statusCode).toBe(404);
    expect(exception.message).toBe(
      `User conversation with chatId ${chatId} not found`,
    );
  });
});
