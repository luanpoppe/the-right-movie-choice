import {
  CreateUserGroupDTOSchema,
  GroupInviteIdParamsSchema,
  GroupInviteResponseSchema,
  GroupMemberUserIdParamsSchema,
  IncomingGroupInviteResponseSchema,
  ListGroupFriendSuggestionsResponseSchema,
  ListIncomingGroupInvitesResponseSchema,
  ListUserGroupsResponseSchema,
  SendGroupInviteDTOSchema,
  UpdateUserGroupDTOSchema,
  UserGroupIdParamsSchema,
  UserGroupListItemResponseSchema,
} from "../user-groups.dto";

class UserGroupsDtoFixtures {
  static groupListItem(
    overrides?: Partial<{
      id: number;
      name: string;
      description: string;
      ownerId: number;
      memberCount: number;
      joinedAt: string;
    }>,
  ) {
    return {
      id: 3,
      name: "Sábado cinema",
      description: "Filmes do fim de semana",
      ownerId: 1,
      memberCount: 4,
      joinedAt: "2026-03-18T12:00:00.000Z",
      ...overrides,
    };
  }

  static incomingGroupInvite(
    overrides?: Partial<{
      id: number;
      status: "pending" | "accepted" | "rejected";
    }>,
  ) {
    return {
      id: 40,
      group: {
        id: 3,
        name: "Sábado cinema",
      },
      inviter: {
        id: 2,
        name: "Maria",
        email: "maria@example.com",
      },
      status: "pending" as const,
      createdAt: "2026-03-18T12:00:00.000Z",
      ...overrides,
    };
  }

  static friendSuggestion() {
    return {
      id: 5,
      name: "João",
      email: "joao@example.com",
    };
  }
}

describe("CreateUserGroupDTOSchema", () => {
  it("aceita name e description válidos", () => {
    const parsed = CreateUserGroupDTOSchema.parse({
      name: "Sábado cinema",
      description: "Filmes do fim de semana",
    });

    expect(parsed).toEqual({
      name: "Sábado cinema",
      description: "Filmes do fim de semana",
    });
  });

  it("aceita body sem description", () => {
    const parsed = CreateUserGroupDTOSchema.parse({
      name: "Sábado cinema",
    });

    expect(parsed.description).toBeUndefined();
  });

  it("rejeita name vazio", () => {
    const parseResult = CreateUserGroupDTOSchema.safeParse({ name: "   " });

    expect(parseResult.success).toBe(false);
  });

  it("rejeita campos extras", () => {
    const parseResult = CreateUserGroupDTOSchema.safeParse({
      name: "Grupo",
      extra: true,
    });

    expect(parseResult.success).toBe(false);
  });
});

describe("UpdateUserGroupDTOSchema", () => {
  it("aceita name e description", () => {
    const parsed = UpdateUserGroupDTOSchema.parse({
      name: "Domingo série",
      description: "Maratonas de TV",
    });

    expect(parsed.name).toBe("Domingo série");
    expect(parsed.description).toBe("Maratonas de TV");
  });

  it("aceita patch parcial só com name", () => {
    const parsed = UpdateUserGroupDTOSchema.parse({
      name: "Novo nome",
    });

    expect(parsed.name).toBe("Novo nome");
    expect(parsed.description).toBeUndefined();
  });

  it("rejeita patch vazio", () => {
    const parseResult = UpdateUserGroupDTOSchema.safeParse({});

    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.message).toBe(
        "patch must contain at least one field to update",
      );
    }
  });

  it("rejeita name vazio no patch", () => {
    const parseResult = UpdateUserGroupDTOSchema.safeParse({ name: "" });

    expect(parseResult.success).toBe(false);
  });
});

describe("SendGroupInviteDTOSchema", () => {
  it("aceita email válido", () => {
    const parsed = SendGroupInviteDTOSchema.parse({
      email: "maria@example.com",
    });

    expect(parsed.email).toBe("maria@example.com");
  });

  it("rejeita email inválido", () => {
    const parseResult = SendGroupInviteDTOSchema.safeParse({
      email: "invalid",
    });

    expect(parseResult.success).toBe(false);
  });
});

describe("UserGroupIdParamsSchema", () => {
  it("aceita id numérico positivo como string na rota", () => {
    const parseResult = UserGroupIdParamsSchema.safeParse({ id: "3" });

    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.id).toBe(3);
    }
  });

  it("rejeita id inválido (zero, negativo ou não numérico)", () => {
    expect(UserGroupIdParamsSchema.safeParse({ id: "0" }).success).toBe(false);
    expect(UserGroupIdParamsSchema.safeParse({ id: "-1" }).success).toBe(false);
    expect(UserGroupIdParamsSchema.safeParse({ id: "abc" }).success).toBe(
      false,
    );
    expect(
      UserGroupIdParamsSchema.safeParse({ id: undefined }).success,
    ).toBe(false);
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

describe("UserGroupListItemResponseSchema", () => {
  it("aceita item de listagem de grupos", () => {
    const groupListItem = UserGroupsDtoFixtures.groupListItem();
    const parsed = UserGroupListItemResponseSchema.parse(groupListItem);

    expect(parsed).toEqual(groupListItem);
  });

  it("rejeita memberCount negativo", () => {
    const groupListItem = UserGroupsDtoFixtures.groupListItem({
      memberCount: -1,
    });
    const parseResult =
      UserGroupListItemResponseSchema.safeParse(groupListItem);

    expect(parseResult.success).toBe(false);
  });
});

describe("ListUserGroupsResponseSchema", () => {
  it("aceita array de grupos", () => {
    const groups = [UserGroupsDtoFixtures.groupListItem()];
    const parsed = ListUserGroupsResponseSchema.parse(groups);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.name).toBe("Sábado cinema");
  });
});

describe("GroupInviteResponseSchema", () => {
  it("aceita convite de grupo com status pending", () => {
    const parsed = GroupInviteResponseSchema.parse({
      id: 40,
      groupId: 3,
      inviterId: 1,
      inviteeId: 2,
      status: "pending",
      createdAt: "2026-03-18T12:00:00.000Z",
      updatedAt: "2026-03-18T12:00:00.000Z",
    });

    expect(parsed.status).toBe("pending");
  });
});

describe("ListGroupFriendSuggestionsResponseSchema", () => {
  it("aceita array de sugestões de amigos", () => {
    const suggestions = [UserGroupsDtoFixtures.friendSuggestion()];
    const parsed = ListGroupFriendSuggestionsResponseSchema.parse(suggestions);

    expect(parsed[0]?.email).toBe("joao@example.com");
  });
});

describe("IncomingGroupInviteResponseSchema", () => {
  it("aceita convite recebido com group e inviter", () => {
    const incomingInvite = UserGroupsDtoFixtures.incomingGroupInvite();
    const parsed = IncomingGroupInviteResponseSchema.parse(incomingInvite);

    expect(parsed.group.name).toBe("Sábado cinema");
    expect(parsed.inviter.email).toBe("maria@example.com");
  });
});

describe("ListIncomingGroupInvitesResponseSchema", () => {
  it("aceita array de convites recebidos", () => {
    const invites = [UserGroupsDtoFixtures.incomingGroupInvite()];
    const parsed = ListIncomingGroupInvitesResponseSchema.parse(invites);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.status).toBe("pending");
  });
});
