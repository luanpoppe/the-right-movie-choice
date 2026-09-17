import { describe, expect, it } from "vitest";
import { FriendRequestValidationException } from "../../exceptions/friend-request-validation.exception";
import { FriendRequestValidationUtils } from "../friend-request-validation.utils";

describe("FriendRequestValidationUtils", () => {
  describe("assertValidUserId", () => {
    it("aceita userId inteiro positivo", () => {
      expect(() => FriendRequestValidationUtils.assertValidUserId(1)).not.toThrow();
      expect(() => FriendRequestValidationUtils.assertValidUserId(42)).not.toThrow();
    });

    it("rejeita userId inválido", () => {
      expect(() => FriendRequestValidationUtils.assertValidUserId(0)).toThrow(
        FriendRequestValidationException,
      );
      expect(() => FriendRequestValidationUtils.assertValidUserId(-1)).toThrow(
        FriendRequestValidationException,
      );
      expect(() => FriendRequestValidationUtils.assertValidUserId(1.5)).toThrow(
        FriendRequestValidationException,
      );
    });
  });

  describe("assertValidEmail", () => {
    it("aceita e-mail válido", () => {
      expect(() =>
        FriendRequestValidationUtils.assertValidEmail("maria@example.com"),
      ).not.toThrow();
    });

    it("rejeita e-mail vazio ou inválido", () => {
      expect(() => FriendRequestValidationUtils.assertValidEmail("")).toThrow(
        FriendRequestValidationException,
      );
      expect(() => FriendRequestValidationUtils.assertValidEmail("invalid")).toThrow(
        FriendRequestValidationException,
      );
    });
  });

  describe("assertNotSelf", () => {
    it("aceita usuários distintos", () => {
      expect(() => FriendRequestValidationUtils.assertNotSelf(7, 12)).not.toThrow();
    });

    it("rejeita solicitação para si mesmo", () => {
      expect(() => FriendRequestValidationUtils.assertNotSelf(7, 7)).toThrow(
        FriendRequestValidationException,
      );
      expect(() => FriendRequestValidationUtils.assertNotSelf(7, 7)).toThrow(
        "cannot send friend request to yourself",
      );
    });
  });

  describe("normalizeEmail", () => {
    it("normaliza e-mail válido para lowercase trimado", () => {
      const normalizedEmail = FriendRequestValidationUtils.normalizeEmail(
        "  Maria@Example.COM ",
      );

      expect(normalizedEmail).toBe("maria@example.com");
    });
  });
});
