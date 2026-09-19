import { describe, expect, it } from "vitest";
import { GroupChatValidationException } from "../exceptions/group-chat-validation.exception";
import {
  GroupChatValidationUtils,
  MAX_TITLE_LENGTH,
} from "../group-chat-validation.utils";

describe("GroupChatValidationUtils", () => {
  describe("constants", () => {
    it("expõe limite de título", () => {
      expect(MAX_TITLE_LENGTH).toBe(200);
    });
  });

  describe("assertValidGroupId", () => {
    it("aceita groupId inteiro positivo", () => {
      expect(() => GroupChatValidationUtils.assertValidGroupId(3)).not.toThrow();
    });

    it("rejeita groupId inválido", () => {
      expect(() => GroupChatValidationUtils.assertValidGroupId(0)).toThrow(
        GroupChatValidationException,
      );
      expect(() => GroupChatValidationUtils.assertValidGroupId(-1)).toThrow(
        GroupChatValidationException,
      );
      expect(() => GroupChatValidationUtils.assertValidGroupId(1.5)).toThrow(
        GroupChatValidationException,
      );
    });
  });

  describe("assertValidId", () => {
    it("aceita id inteiro positivo", () => {
      expect(() => GroupChatValidationUtils.assertValidId(40)).not.toThrow();
    });

    it("rejeita id inválido", () => {
      expect(() => GroupChatValidationUtils.assertValidId(0)).toThrow(
        GroupChatValidationException,
      );
    });
  });

  describe("assertValidChatId", () => {
    it("aceita UUID v4 válido", () => {
      expect(() =>
        GroupChatValidationUtils.assertValidChatId(
          "550e8400-e29b-41d4-a716-446655440000",
        ),
      ).not.toThrow();
    });

    it("rejeita chatId vazio", () => {
      expect(() => GroupChatValidationUtils.assertValidChatId("")).toThrow(
        GroupChatValidationException,
      );
      expect(() => GroupChatValidationUtils.assertValidChatId("   ")).toThrow(
        GroupChatValidationException,
      );
    });

    it("rejeita UUID inválido", () => {
      expect(() =>
        GroupChatValidationUtils.assertValidChatId("not-a-uuid"),
      ).toThrow(GroupChatValidationException);
      expect(() =>
        GroupChatValidationUtils.assertValidChatId(
          "00000000-0000-0000-0000-000000000000",
        ),
      ).toThrow(GroupChatValidationException);
    });
  });

  describe("assertValidTitle", () => {
    it("aceita título dentro do limite", () => {
      const title = "a".repeat(MAX_TITLE_LENGTH);
      expect(() => GroupChatValidationUtils.assertValidTitle(title)).not.toThrow();
    });

    it("rejeita título acima do limite", () => {
      const title = "a".repeat(MAX_TITLE_LENGTH + 1);
      expect(() => GroupChatValidationUtils.assertValidTitle(title)).toThrow(
        GroupChatValidationException,
      );
    });
  });

  describe("assertValidFilterMemberUserIds", () => {
    it("aceita lista de ids positivos únicos", () => {
      expect(() =>
        GroupChatValidationUtils.assertValidFilterMemberUserIds([7, 12, 15]),
      ).not.toThrow();
    });

    it("aceita lista vazia (REQ-8: modo sem filtro de assistidos)", () => {
      expect(() =>
        GroupChatValidationUtils.assertValidFilterMemberUserIds([]),
      ).not.toThrow();
    });

    it("rejeita id não positivo", () => {
      expect(() =>
        GroupChatValidationUtils.assertValidFilterMemberUserIds([7, 0]),
      ).toThrow(GroupChatValidationException);
    });

    it("rejeita ids duplicados", () => {
      expect(() =>
        GroupChatValidationUtils.assertValidFilterMemberUserIds([7, 7]),
      ).toThrow(GroupChatValidationException);
    });
  });

  describe("assertValidCreateInput", () => {
    it("REQ-1: aceita input válido com title opcional ausente", () => {
      expect(() =>
        GroupChatValidationUtils.assertValidCreateInput({
          groupId: 3,
          chatId: "550e8400-e29b-41d4-a716-446655440000",
          filterMemberUserIds: [7, 12, 15],
        }),
      ).not.toThrow();
    });

    it("aceita input com title explícito", () => {
      expect(() =>
        GroupChatValidationUtils.assertValidCreateInput({
          groupId: 3,
          chatId: "550e8400-e29b-41d4-a716-446655440000",
          title: "Sábado",
          filterMemberUserIds: [7],
        }),
      ).not.toThrow();
    });

    it("rejeita input com chatId inválido", () => {
      expect(() =>
        GroupChatValidationUtils.assertValidCreateInput({
          groupId: 3,
          chatId: "invalid",
          filterMemberUserIds: [7],
        }),
      ).toThrow(GroupChatValidationException);
    });
  });
});
