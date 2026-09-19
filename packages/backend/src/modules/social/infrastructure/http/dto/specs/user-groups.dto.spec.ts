import { describe, expect, it } from "vitest";
import {
  CreateUserGroupDTOSchema,
  GroupInviteIdParamsSchema,
  GroupMemberUserIdParamsSchema,
  ListGroupMembersResponseSchema,
  SendGroupInviteDTOSchema,
  UpdateUserGroupDTOSchema,
  UserGroupIdParamsSchema,
} from "../user-groups.dto";

describe("User groups DTO schemas", () => {
  describe("CreateUserGroupDTOSchema", () => {
    it("REQ-1: aceita name e description válidos", () => {
      const parsed = CreateUserGroupDTOSchema.parse({
        name: "Sábado cinema",
        description: "Filmes do fim de semana",
      });

      expect(parsed).toEqual({
        name: "Sábado cinema",
        description: "Filmes do fim de semana",
      });
    });

    it("REQ-1: aceita body sem description", () => {
      const parsed = CreateUserGroupDTOSchema.parse({
        name: "Sábado cinema",
      });

      expect(parsed.description).toBeUndefined();
    });

    it("edge: rejeita name vazio", () => {
      expect(() =>
        CreateUserGroupDTOSchema.parse({ name: "   " }),
      ).toThrow();
    });

    it("edge: rejeita campos extras", () => {
      expect(() =>
        CreateUserGroupDTOSchema.parse({
          name: "Grupo",
          extra: true,
        }),
      ).toThrow();
    });
  });

  describe("UpdateUserGroupDTOSchema", () => {
    it("REQ-16: aceita name e description", () => {
      const parsed = UpdateUserGroupDTOSchema.parse({
        name: "Domingo série",
        description: "Maratonas de TV",
      });

      expect(parsed.name).toBe("Domingo série");
      expect(parsed.description).toBe("Maratonas de TV");
    });

    it("REQ-17: aceita patch parcial só com name", () => {
      const parsed = UpdateUserGroupDTOSchema.parse({
        name: "Novo nome",
      });

      expect(parsed.name).toBe("Novo nome");
      expect(parsed.description).toBeUndefined();
    });

    it("edge: rejeita patch vazio", () => {
      expect(() => UpdateUserGroupDTOSchema.parse({})).toThrow(
        "patch must contain at least one field to update",
      );
    });

    it("edge: rejeita name vazio no patch", () => {
      expect(() =>
        UpdateUserGroupDTOSchema.parse({ name: "" }),
      ).toThrow();
    });
  });

  describe("SendGroupInviteDTOSchema", () => {
    it("REQ-3: aceita email válido", () => {
      const parsed = SendGroupInviteDTOSchema.parse({
        email: "maria@example.com",
      });

      expect(parsed.email).toBe("maria@example.com");
    });

    it("edge: rejeita email inválido", () => {
      expect(() =>
        SendGroupInviteDTOSchema.parse({ email: "invalid" }),
      ).toThrow();
    });
  });

  describe("UserGroupIdParamsSchema", () => {
    it("coerce id string positivo para número", () => {
      const parsed = UserGroupIdParamsSchema.parse({ id: "3" });

      expect(parsed.id).toBe(3);
    });

    it("rejeita id não positivo", () => {
      expect(() => UserGroupIdParamsSchema.parse({ id: "0" })).toThrow();
    });
  });

  describe("GroupMemberUserIdParamsSchema", () => {
    it("coerce group id e userId strings para números", () => {
      const parsed = GroupMemberUserIdParamsSchema.parse({
        id: "3",
        userId: "15",
      });

      expect(parsed.id).toBe(3);
      expect(parsed.userId).toBe(15);
    });
  });

  describe("GroupInviteIdParamsSchema", () => {
    it("coerce id string positivo para número", () => {
      const parsed = GroupInviteIdParamsSchema.parse({ id: "40" });

      expect(parsed.id).toBe(40);
    });
  });

  describe("ListGroupMembersResponseSchema", () => {
    it("REQ-4: aceita array de UserPublic", () => {
      const parsed = ListGroupMembersResponseSchema.parse([
        { id: 7, name: "João", email: "joao@example.com" },
        { id: 12, name: "Maria", email: "maria@example.com" },
      ]);

      expect(parsed).toHaveLength(2);
      expect(parsed[0]?.id).toBe(7);
      expect(parsed[1]?.email).toBe("maria@example.com");
    });

    it("edge: rejeita item sem email", () => {
      expect(() =>
        ListGroupMembersResponseSchema.parse([
          { id: 7, name: "João" },
        ]),
      ).toThrow();
    });
  });
});
