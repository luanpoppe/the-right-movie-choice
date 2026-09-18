import { describe, expect, it } from "vitest";
import {
  FriendRequestIdParamsSchema,
  FriendUserIdParamsSchema,
  SearchUserByEmailQuerySchema,
  SendFriendRequestDTOSchema,
} from "../friendship.dto";

describe("Friendship DTO schemas", () => {
  describe("SendFriendRequestDTOSchema", () => {
    it("REQ-1: aceita body com email válido", () => {
      const parsed = SendFriendRequestDTOSchema.parse({
        email: "maria@example.com",
      });

      expect(parsed).toEqual({ email: "maria@example.com" });
    });

    it("edge: rejeita email ausente", () => {
      expect(() => SendFriendRequestDTOSchema.parse({})).toThrow();
    });

    it("edge: rejeita email inválido", () => {
      expect(() =>
        SendFriendRequestDTOSchema.parse({ email: "invalid" }),
      ).toThrow();
    });

    it("edge: rejeita campos extras no body", () => {
      expect(() =>
        SendFriendRequestDTOSchema.parse({
          email: "maria@example.com",
          extra: true,
        }),
      ).toThrow();
    });
  });

  describe("SearchUserByEmailQuerySchema", () => {
    it("REQ-9: aceita query com email válido", () => {
      const parsed = SearchUserByEmailQuerySchema.parse({
        email: "maria@example.com",
      });

      expect(parsed.email).toBe("maria@example.com");
    });

    it("edge: rejeita busca sem email", () => {
      expect(() => SearchUserByEmailQuerySchema.parse({})).toThrow();
    });

    it("edge: rejeita email inválido na busca", () => {
      expect(() =>
        SearchUserByEmailQuerySchema.parse({ email: "not-an-email" }),
      ).toThrow();
    });
  });

  describe("FriendRequestIdParamsSchema", () => {
    it("coerce id string positivo para número", () => {
      const parsed = FriendRequestIdParamsSchema.parse({ id: "55" });

      expect(parsed.id).toBe(55);
    });

    it("rejeita id não positivo", () => {
      expect(() => FriendRequestIdParamsSchema.parse({ id: "0" })).toThrow();
    });
  });

  describe("FriendUserIdParamsSchema", () => {
    it("coerce userId string positivo para número", () => {
      const parsed = FriendUserIdParamsSchema.parse({ userId: "12" });

      expect(parsed.userId).toBe(12);
    });
  });
});
