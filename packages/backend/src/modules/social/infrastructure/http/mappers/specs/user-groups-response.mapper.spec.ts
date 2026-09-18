import { describe, expect, it } from "vitest";
import type { UserPublicEntity } from "@/modules/social/domain/entities/friend-request.entity";
import type {
  GroupInviteEntity,
  IncomingGroupInviteEntity,
} from "@/modules/social/domain/entities/group-invite.entity";
import type {
  UserGroupEntity,
  UserGroupListItemEntity,
} from "@/modules/social/domain/entities/user-group.entity";
import { UserGroupsResponseMapper } from "../user-groups-response.mapper";

class UserGroupsResponseMapperFixtures {
  static userGroup(overrides: Partial<UserGroupEntity> = {}): UserGroupEntity {
    return {
      id: 3,
      name: "Sábado cinema",
      description: "Filmes do fim de semana",
      ownerId: 7,
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-02T10:00:00.000Z"),
      ...overrides,
    };
  }

  static listItem(
    overrides: Partial<UserGroupListItemEntity> = {},
  ): UserGroupListItemEntity {
    return {
      id: 3,
      name: "Sábado cinema",
      description: "Filmes do fim de semana",
      ownerId: 7,
      memberCount: 2,
      joinedAt: new Date("2026-03-01T10:00:00.000Z"),
      ...overrides,
    };
  }

  static groupInvite(
    overrides: Partial<GroupInviteEntity> = {},
  ): GroupInviteEntity {
    return {
      id: 40,
      groupId: 3,
      inviterId: 7,
      inviteeId: 12,
      status: "pending",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-02T10:00:00.000Z"),
      ...overrides,
    };
  }

  static incomingInvite(
    overrides: Partial<IncomingGroupInviteEntity> = {},
  ): IncomingGroupInviteEntity {
    return {
      id: 40,
      group: { id: 3, name: "Sábado cinema" },
      inviter: { id: 7, name: "João", email: "joao@example.com" },
      status: "pending",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      ...overrides,
    };
  }

  static friendSuggestion(
    overrides: Partial<UserPublicEntity> = {},
  ): UserPublicEntity {
    return {
      id: 12,
      name: "Maria",
      email: "maria@example.com",
      ...overrides,
    };
  }
}

describe("UserGroupsResponseMapper", () => {
  it("toUserGroupResponse serializa datas em ISO string", () => {
    const entity = UserGroupsResponseMapperFixtures.userGroup();

    const response = UserGroupsResponseMapper.toUserGroupResponse(entity);

    expect(response).toEqual({
      id: 3,
      name: "Sábado cinema",
      description: "Filmes do fim de semana",
      ownerId: 7,
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-02T10:00:00.000Z",
    });
  });

  it("toUserGroupResponse omite description quando ausente", () => {
    const { description: _description, ...entity } =
      UserGroupsResponseMapperFixtures.userGroup();

    const response = UserGroupsResponseMapper.toUserGroupResponse(entity);

    expect(response.description).toBeUndefined();
  });

  it("toUserGroupListItemResponse mapeia memberCount e joinedAt", () => {
    const entity = UserGroupsResponseMapperFixtures.listItem();

    const response = UserGroupsResponseMapper.toUserGroupListItemResponse(entity);

    expect(response).toEqual({
      id: 3,
      name: "Sábado cinema",
      description: "Filmes do fim de semana",
      ownerId: 7,
      memberCount: 2,
      joinedAt: "2026-03-01T10:00:00.000Z",
    });
  });

  it("toListUserGroupsResponse mapeia lista de grupos", () => {
    const entities = [
      UserGroupsResponseMapperFixtures.listItem({ id: 3 }),
      UserGroupsResponseMapperFixtures.listItem({ id: 8, name: "Outro" }),
    ];

    const response = UserGroupsResponseMapper.toListUserGroupsResponse(entities);

    expect(response).toHaveLength(2);
    expect(response[0]?.id).toBe(3);
    expect(response[1]?.id).toBe(8);
  });

  it("toGroupInviteResponse serializa convite", () => {
    const entity = UserGroupsResponseMapperFixtures.groupInvite({
      status: "accepted",
    });

    const response = UserGroupsResponseMapper.toGroupInviteResponse(entity);

    expect(response).toEqual({
      id: 40,
      groupId: 3,
      inviterId: 7,
      inviteeId: 12,
      status: "accepted",
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-02T10:00:00.000Z",
    });
  });

  it("toListGroupFriendSuggestionsResponse mapeia sugestões", () => {
    const entities = [UserGroupsResponseMapperFixtures.friendSuggestion()];

    const response =
      UserGroupsResponseMapper.toListGroupFriendSuggestionsResponse(entities);

    expect(response).toEqual([
      { id: 12, name: "Maria", email: "maria@example.com" },
    ]);
  });

  it("toListGroupMembersResponse mapeia membros com shape UserPublic", () => {
    const entities = [
      UserGroupsResponseMapperFixtures.friendSuggestion({
        id: 7,
        name: "João",
        email: "joao@example.com",
      }),
      UserGroupsResponseMapperFixtures.friendSuggestion(),
    ];

    const response =
      UserGroupsResponseMapper.toListGroupMembersResponse(entities);

    expect(response).toEqual([
      { id: 7, name: "João", email: "joao@example.com" },
      { id: 12, name: "Maria", email: "maria@example.com" },
    ]);
  });

  it("toIncomingGroupInviteResponse mapeia grupo e inviter aninhados", () => {
    const entity = UserGroupsResponseMapperFixtures.incomingInvite();

    const response =
      UserGroupsResponseMapper.toIncomingGroupInviteResponse(entity);

    expect(response).toEqual({
      id: 40,
      group: { id: 3, name: "Sábado cinema" },
      inviter: { id: 7, name: "João", email: "joao@example.com" },
      status: "pending",
      createdAt: "2026-03-01T10:00:00.000Z",
    });
  });

  it("toListIncomingGroupInvitesResponse mapeia lista de convites", () => {
    const entities = [
      UserGroupsResponseMapperFixtures.incomingInvite({ id: 40 }),
      UserGroupsResponseMapperFixtures.incomingInvite({
        id: 42,
        group: { id: 5, name: "Domingo série" },
      }),
    ];

    const response =
      UserGroupsResponseMapper.toListIncomingGroupInvitesResponse(entities);

    expect(response).toHaveLength(2);
    expect(response[0]?.id).toBe(40);
    expect(response[1]?.group.id).toBe(5);
  });
});
