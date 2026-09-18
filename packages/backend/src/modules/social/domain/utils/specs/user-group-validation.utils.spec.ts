import { describe, expect, it } from "vitest";
import { UserGroupValidationException } from "../../exceptions/user-group-validation.exception";
import {
  MAX_GROUP_DESCRIPTION_LENGTH,
  MAX_GROUP_MEMBERS,
  MAX_GROUP_NAME_LENGTH,
  UserGroupValidationUtils,
} from "../user-group-validation.utils";

describe("UserGroupValidationUtils", () => {
  describe("constants", () => {
    it("expõe limites de grupo", () => {
      expect(MAX_GROUP_NAME_LENGTH).toBe(100);
      expect(MAX_GROUP_DESCRIPTION_LENGTH).toBe(500);
      expect(MAX_GROUP_MEMBERS).toBe(100);
    });
  });

  describe("assertValidUserId", () => {
    it("aceita userId inteiro positivo", () => {
      expect(() => UserGroupValidationUtils.assertValidUserId(1)).not.toThrow();
      expect(() => UserGroupValidationUtils.assertValidUserId(42)).not.toThrow();
    });

    it("rejeita userId inválido", () => {
      expect(() => UserGroupValidationUtils.assertValidUserId(0)).toThrow(
        UserGroupValidationException,
      );
      expect(() => UserGroupValidationUtils.assertValidUserId(-1)).toThrow(
        UserGroupValidationException,
      );
      expect(() => UserGroupValidationUtils.assertValidUserId(1.5)).toThrow(
        UserGroupValidationException,
      );
    });
  });

  describe("assertValidGroupId", () => {
    it("aceita groupId inteiro positivo", () => {
      expect(() => UserGroupValidationUtils.assertValidGroupId(3)).not.toThrow();
    });

    it("rejeita groupId inválido", () => {
      expect(() => UserGroupValidationUtils.assertValidGroupId(0)).toThrow(
        UserGroupValidationException,
      );
      expect(() => UserGroupValidationUtils.assertValidGroupId(-2)).toThrow(
        UserGroupValidationException,
      );
    });
  });

  describe("assertValidGroupInviteId", () => {
    it("aceita groupInviteId inteiro positivo", () => {
      expect(() =>
        UserGroupValidationUtils.assertValidGroupInviteId(40),
      ).not.toThrow();
    });

    it("rejeita groupInviteId inválido", () => {
      expect(() => UserGroupValidationUtils.assertValidGroupInviteId(0)).toThrow(
        UserGroupValidationException,
      );
    });
  });

  describe("assertValidEmail", () => {
    it("aceita e-mail válido", () => {
      expect(() =>
        UserGroupValidationUtils.assertValidEmail("maria@example.com"),
      ).not.toThrow();
    });

    it("rejeita e-mail vazio ou inválido", () => {
      expect(() => UserGroupValidationUtils.assertValidEmail("")).toThrow(
        UserGroupValidationException,
      );
      expect(() => UserGroupValidationUtils.assertValidEmail("invalid")).toThrow(
        UserGroupValidationException,
      );
    });
  });

  describe("assertValidName", () => {
    it("aceita nome não vazio dentro do limite", () => {
      expect(() =>
        UserGroupValidationUtils.assertValidName("Sábado cinema"),
      ).not.toThrow();
    });

    it("rejeita nome vazio ou só espaços", () => {
      expect(() => UserGroupValidationUtils.assertValidName("")).toThrow(
        UserGroupValidationException,
      );
      expect(() => UserGroupValidationUtils.assertValidName("   ")).toThrow(
        UserGroupValidationException,
      );
    });

    it("rejeita nome acima do limite", () => {
      const longName = "a".repeat(MAX_GROUP_NAME_LENGTH + 1);

      expect(() => UserGroupValidationUtils.assertValidName(longName)).toThrow(
        UserGroupValidationException,
      );
    });
  });

  describe("assertValidDescription", () => {
    it("aceita descrição omitida ou dentro do limite", () => {
      expect(() =>
        UserGroupValidationUtils.assertValidDescription(undefined),
      ).not.toThrow();
      expect(() =>
        UserGroupValidationUtils.assertValidDescription(null),
      ).not.toThrow();
      expect(() =>
        UserGroupValidationUtils.assertValidDescription("Filmes do fim de semana"),
      ).not.toThrow();
    });

    it("rejeita descrição acima do limite", () => {
      const longDescription = "a".repeat(MAX_GROUP_DESCRIPTION_LENGTH + 1);

      expect(() =>
        UserGroupValidationUtils.assertValidDescription(longDescription),
      ).toThrow(UserGroupValidationException);
    });
  });

  describe("assertNotSelf", () => {
    it("aceita usuários distintos", () => {
      expect(() => UserGroupValidationUtils.assertNotSelf(7, 12)).not.toThrow();
    });

    it("rejeita convite para si mesmo", () => {
      expect(() => UserGroupValidationUtils.assertNotSelf(7, 7)).toThrow(
        UserGroupValidationException,
      );
      expect(() => UserGroupValidationUtils.assertNotSelf(7, 7)).toThrow(
        "cannot invite yourself",
      );
    });
  });

  describe("normalizeEmail", () => {
    it("normaliza e-mail válido para lowercase trimado", () => {
      const normalizedEmail = UserGroupValidationUtils.normalizeEmail(
        "  Maria@Example.COM ",
      );

      expect(normalizedEmail).toBe("maria@example.com");
    });
  });
});
