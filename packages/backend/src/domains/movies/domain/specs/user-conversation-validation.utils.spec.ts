import { describe, expect, it } from "vitest";
import { UserConversationConstants } from "../user-conversation.constants";
import { UserConversationValidationException } from "../exceptions/user-conversation-validation.exception";
import { UserConversationValidationUtils } from "../user-conversation-validation.utils";

describe("UserConversationValidationUtils", () => {
  const validChatId = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";

  describe("assertValidUserId", () => {
    it("aceita userId inteiro positivo", () => {
      expect(() =>
        UserConversationValidationUtils.assertValidUserId(7),
      ).not.toThrow();
    });

    it("rejeita userId zero ou negativo", () => {
      expect(() => UserConversationValidationUtils.assertValidUserId(0)).toThrow(
        UserConversationValidationException,
      );
      expect(() =>
        UserConversationValidationUtils.assertValidUserId(-1),
      ).toThrow("userId must be a positive integer, received -1");
    });
  });

  describe("assertValidChatId", () => {
    it("aceita UUID v4 válido", () => {
      expect(() =>
        UserConversationValidationUtils.assertValidChatId(validChatId),
      ).not.toThrow();
    });

    it("rejeita chatId vazio", () => {
      expect(() => UserConversationValidationUtils.assertValidChatId("")).toThrow(
        "chatId must be a non-empty UUID v4 string",
      );
    });

    it("rejeita string que não é UUID v4", () => {
      expect(() =>
        UserConversationValidationUtils.assertValidChatId("not-a-uuid"),
      ).toThrow(
        "chatId must be a valid UUID v4 string, received not-a-uuid",
      );
    });
  });

  describe("assertValidTitle", () => {
    it("aceita título dentro do limite", () => {
      const title = "Filmes de ficção dos anos 90";
      expect(() =>
        UserConversationValidationUtils.assertValidTitle(title),
      ).not.toThrow();
    });

    it("rejeita título acima do limite", () => {
      const maxTitleLength = UserConversationConstants.MAX_TITLE_LENGTH;
      const longTitle = "a".repeat(maxTitleLength + 1);

      expect(() =>
        UserConversationValidationUtils.assertValidTitle(longTitle),
      ).toThrow(
        `title must be at most ${maxTitleLength} characters, received ${maxTitleLength + 1}`,
      );
    });
  });

  describe("assertValidCreateInput", () => {
    it("valida userId e chatId juntos", () => {
      expect(() =>
        UserConversationValidationUtils.assertValidCreateInput(7, validChatId),
      ).not.toThrow();
    });

    it("falha quando chatId é inválido", () => {
      expect(() =>
        UserConversationValidationUtils.assertValidCreateInput(7, "bad-id"),
      ).toThrow(UserConversationValidationException);
    });
  });
});
