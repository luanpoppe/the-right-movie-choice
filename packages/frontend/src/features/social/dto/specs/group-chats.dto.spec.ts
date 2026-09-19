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

class GroupChatsDtoFixtures {
  static summary(overrides: Record<string, unknown> = {}) {
    return {
      id: 40,
      groupId: 3,
      chatId: "550e8400-e29b-41d4-a716-446655440000",
      title: null,
      filterMemberUserIds: [7, 12, 15],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      ...overrides,
    };
  }
}

describe("CreateGroupChatDTOSchema", () => {
  it("aceita body vazio", () => {
    const parsed = CreateGroupChatDTOSchema.parse({});

    expect(parsed.title).toBeUndefined();
  });

  it("aceita title opcional", () => {
    const parsed = CreateGroupChatDTOSchema.parse({ title: "Sábado" });

    expect(parsed.title).toBe("Sábado");
  });

  it("rejeita campos extras", () => {
    const parseResult = CreateGroupChatDTOSchema.safeParse({
      title: "Sábado",
      extra: true,
    });

    expect(parseResult.success).toBe(false);
  });
});

describe("UpdateGroupChatTitleDTOSchema", () => {
  it("aceita title válido", () => {
    const parsed = UpdateGroupChatTitleDTOSchema.parse({
      title: "Terror leve",
    });

    expect(parsed.title).toBe("Terror leve");
  });

  it("rejeita body sem title", () => {
    const parseResult = UpdateGroupChatTitleDTOSchema.safeParse({});

    expect(parseResult.success).toBe(false);
  });
});

describe("UpdateGroupChatFilterMembersDTOSchema", () => {
  it("aceita userIds positivos", () => {
    const parsed = UpdateGroupChatFilterMembersDTOSchema.parse({
      userIds: [7, 12],
    });

    expect(parsed.userIds).toEqual([7, 12]);
  });

  it("rejeita userIds não positivos", () => {
    const parseResult = UpdateGroupChatFilterMembersDTOSchema.safeParse({
      userIds: [0],
    });

    expect(parseResult.success).toBe(false);
  });
});

describe("GroupChatRecommendationRequestDTOSchema", () => {
  it("aceita query não vazia", () => {
    const parsed = GroupChatRecommendationRequestDTOSchema.parse({
      query: "comédia leve",
    });

    expect(parsed.query).toBe("comédia leve");
  });

  it("rejeita query vazia", () => {
    const parseResult = GroupChatRecommendationRequestDTOSchema.safeParse({
      query: "   ",
    });

    expect(parseResult.success).toBe(false);
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
    const parseResult = GroupChatChatIdParamsSchema.safeParse({
      groupId: "3",
      chatId: "not-a-uuid",
    });

    expect(parseResult.success).toBe(false);
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
    const summary = GroupChatsDtoFixtures.summary();
    const parsed = GroupChatSummarySchema.parse(summary);

    expect(parsed.filterMemberUserIds).toEqual([7, 12, 15]);
    expect(parsed.title).toBeNull();
  });
});

describe("GroupChatGetResponseSchema", () => {
  it("aceita messages no mesmo shape de conversas", () => {
    const summary = GroupChatsDtoFixtures.summary({ title: "Sábado" });
    const payload = {
      ...summary,
      messages: [["user", "comédia leve"]],
    };
    const parsed = GroupChatGetResponseSchema.parse(payload);

    expect(parsed.messages).toHaveLength(1);
  });
});

describe("GroupChatInvalidFilterMemberUserIdsResponseSchema", () => {
  it("aceita lista de invalidUserIds", () => {
    const parsed = GroupChatInvalidFilterMemberUserIdsResponseSchema.parse({
      error:
        "filterMemberUserIds contains user ids that are not group members: 99",
      invalidUserIds: [99],
    });

    expect(parsed.invalidUserIds).toEqual([99]);
  });
});
