import { describe, expect, it } from "vitest";
import { UserConversationValidationException } from "../user-conversation-validation.exception";

describe("UserConversationValidationException", () => {
  it("expõe status 400 e repassa a mensagem de validação", () => {
    const message = "chatId must be a valid UUID v4 string, received bad-id";
    const exception = new UserConversationValidationException(message);

    expect(exception.statusCode).toBe(400);
    expect(exception.message).toBe(message);
  });
});
