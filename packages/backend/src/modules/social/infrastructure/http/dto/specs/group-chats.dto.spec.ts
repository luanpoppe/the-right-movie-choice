import { describe, expect, it } from "vitest";
import {
  CreateGroupChatDTOSchema,
  GroupChatChatIdParamsSchema,
  GroupChatGetResponseSchema,
  GroupChatGroupIdParamsSchema,
  GroupChatInvalidFilterMemberUserIdsResponseSchema,
  GroupChatNumericIdParamsSchema,
  GroupChatRecommendationRequestDTOSchema,
  GroupChatSummarySchema,
  UpdateGroupChatFilterMembersDTOSchema,
  UpdateGroupChatTitleDTOSchema,
} from "../group-chats.dto";

describe("Group chats DTO schemas", () => {
  describe("CreateGroupChatDTOSchema", () => {
    it("REQ-1: aceita body vazio", () => {
      const parsed = CreateGroupChatDTOSchema.parse({});

      expect(parsed.title).toBeUndefined();
    });

    it("REQ-1: aceita title opcional", () => {
      const parsed = CreateGroupChatDTOSchema.parse({ title: "Sábado" });

      expect(parsed.title).toBe("Sábado");
    });

    it("edge: rejeita campos extras", () => {
      expect(() =>
        CreateGroupChatDTOSchema.parse({ title: "Sábado", extra: true }),
      ).toThrow();
    });
  });

  describe("UpdateGroupChatTitleDTOSchema", () => {
    it("REQ-3: aceita title válido", () => {
      const parsed = UpdateGroupChatTitleDTOSchema.parse({
        title: "Terror leve",
      });

      expect(parsed.title).toBe("Terror leve");
    });

    it("edge: rejeita body sem title", () => {
      expect(() => UpdateGroupChatTitleDTOSchema.parse({})).toThrow();
    });
  });

  describe("UpdateGroupChatFilterMembersDTOSchema", () => {
    it("REQ-4: aceita userIds positivos", () => {
      const parsed = UpdateGroupChatFilterMembersDTOSchema.parse({
        userIds: [7, 12],
      });

      expect(parsed.userIds).toEqual([7, 12]);
    });

    it("edge: rejeita userIds não positivos", () => {
      expect(() =>
        UpdateGroupChatFilterMembersDTOSchema.parse({ userIds: [0] }),
      ).toThrow();
    });
  });

  describe("GroupChatRecommendationRequestDTOSchema", () => {
    it("REQ-5: aceita query não vazia", () => {
      const parsed = GroupChatRecommendationRequestDTOSchema.parse({
        query: "comédia leve",
      });

      expect(parsed.query).toBe("comédia leve");
    });

    it("edge: rejeita query vazia", () => {
      expect(() =>
        GroupChatRecommendationRequestDTOSchema.parse({ query: "   " }),
      ).toThrow();
    });
  });

  describe("GroupChatGroupIdParamsSchema", () => {
    it("coerce groupId string positivo para número", () => {
      const parsed = GroupChatGroupIdParamsSchema.parse({ groupId: "3" });

      expect(parsed.groupId).toBe(3);
    });
  });

  describe("GroupChatChatIdParamsSchema", () => {
    it("coerce groupId e valida chatId UUID", () => {
      const chatId = "550e8400-e29b-41d4-a716-446655440000";
      const parsed = GroupChatChatIdParamsSchema.parse({
        groupId: "3",
        chatId,
      });

      expect(parsed.groupId).toBe(3);
      expect(parsed.chatId).toBe(chatId);
    });

    it("rejeita chatId inválido", () => {
      expect(() =>
        GroupChatChatIdParamsSchema.parse({
          groupId: "3",
          chatId: "not-a-uuid",
        }),
      ).toThrow();
    });
  });

  describe("GroupChatNumericIdParamsSchema", () => {
    it("coerce groupId e id strings para números", () => {
      const parsed = GroupChatNumericIdParamsSchema.parse({
        groupId: "3",
        id: "40",
      });

      expect(parsed.groupId).toBe(3);
      expect(parsed.id).toBe(40);
    });
  });

  describe("GroupChatSummarySchema", () => {
    it("aceita metadados completos do chat", () => {
      const parsed = GroupChatSummarySchema.parse({
        id: 40,
        groupId: 3,
        chatId: "550e8400-e29b-41d4-a716-446655440000",
        title: null,
        filterMemberUserIds: [7, 12, 15],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      });

      expect(parsed.filterMemberUserIds).toEqual([7, 12, 15]);
      expect(parsed.title).toBeNull();
    });
  });

  describe("GroupChatGetResponseSchema", () => {
    it("REQ-2: aceita messages no mesmo shape de conversas", () => {
      const parsed = GroupChatGetResponseSchema.parse({
        id: 40,
        groupId: 3,
        chatId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Sábado",
        filterMemberUserIds: [7, 12],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
        messages: [["user", "comédia leve"]],
      });

      expect(parsed.messages).toHaveLength(1);
    });
  });

  describe("GroupChatInvalidFilterMemberUserIdsResponseSchema", () => {
    it("REQ-4: aceita lista de invalidUserIds", () => {
      const parsed = GroupChatInvalidFilterMemberUserIdsResponseSchema.parse({
        error:
          "filterMemberUserIds contains user ids that are not group members: 99",
        invalidUserIds: [99],
      });

      expect(parsed.invalidUserIds).toEqual([99]);
    });
  });
});
