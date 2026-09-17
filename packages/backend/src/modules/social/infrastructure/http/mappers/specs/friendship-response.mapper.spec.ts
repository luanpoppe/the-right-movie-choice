import { describe, expect, it } from "vitest";
import type {
  FriendRequestEntity,
  IncomingFriendRequestEntity,
  OutgoingFriendRequestEntity,
  UserPublicEntity,
} from "@/modules/social/domain/entities/friend-request.entity";
import type { SearchUserByEmailResult } from "@/modules/social/application/use-cases/search-user-by-email.use-case";
import { FriendshipResponseMapper } from "../friendship-response.mapper";

class FriendshipResponseMapperFixtures {
  static userPublic(overrides: Partial<UserPublicEntity> = {}): UserPublicEntity {
    return {
      id: 12,
      name: "Maria",
      email: "maria@example.com",
      ...overrides,
    };
  }

  static friendRequest(
    overrides: Partial<FriendRequestEntity> = {},
  ): FriendRequestEntity {
    return {
      id: 55,
      requesterId: 7,
      addresseeId: 12,
      status: "pending",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      ...overrides,
    };
  }

  static incomingRequest(
    overrides: Partial<IncomingFriendRequestEntity> = {},
  ): IncomingFriendRequestEntity {
    return {
      id: 55,
      requester: FriendshipResponseMapperFixtures.userPublic(),
      status: "pending",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      ...overrides,
    };
  }

  static outgoingRequest(
    overrides: Partial<OutgoingFriendRequestEntity> = {},
  ): OutgoingFriendRequestEntity {
    return {
      id: 56,
      addressee: FriendshipResponseMapperFixtures.userPublic({ id: 15 }),
      status: "pending",
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
      ...overrides,
    };
  }
}

describe("FriendshipResponseMapper", () => {
  it("toUserPublicResponse mapeia campos públicos do usuário", () => {
    const entity = FriendshipResponseMapperFixtures.userPublic();

    const response = FriendshipResponseMapper.toUserPublicResponse(entity);

    expect(response).toEqual({
      id: 12,
      name: "Maria",
      email: "maria@example.com",
    });
  });

  it("toFriendRequestResponse serializa datas em ISO string", () => {
    const entity = FriendshipResponseMapperFixtures.friendRequest({
      status: "accepted",
    });

    const response = FriendshipResponseMapper.toFriendRequestResponse(entity);

    expect(response).toEqual({
      id: 55,
      requesterId: 7,
      addresseeId: 12,
      status: "accepted",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("REQ-6: toListFriendsResponse retorna array de usuários", () => {
    const friends = [
      FriendshipResponseMapperFixtures.userPublic(),
      FriendshipResponseMapperFixtures.userPublic({
        id: 15,
        name: "João",
        email: "joao@example.com",
      }),
    ];

    const response = FriendshipResponseMapper.toListFriendsResponse(friends);

    expect(response).toHaveLength(2);
    expect(response[0]).toEqual({
      id: 12,
      name: "Maria",
      email: "maria@example.com",
    });
    expect(response[1]?.id).toBe(15);
  });

  it("REQ-7: toIncomingFriendRequestResponse mapeia requester e createdAt", () => {
    const entity = FriendshipResponseMapperFixtures.incomingRequest();

    const response =
      FriendshipResponseMapper.toIncomingFriendRequestResponse(entity);

    expect(response).toEqual({
      id: 55,
      requester: {
        id: 12,
        name: "Maria",
        email: "maria@example.com",
      },
      status: "pending",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("REQ-7: toListIncomingFriendRequestsResponse retorna array de solicitações", () => {
    const entities = [FriendshipResponseMapperFixtures.incomingRequest()];

    const response =
      FriendshipResponseMapper.toListIncomingFriendRequestsResponse(entities);

    expect(response).toHaveLength(1);
    expect(response[0]?.id).toBe(55);
    expect(response[0]?.requester.email).toBe("maria@example.com");
  });

  it("REQ-8: toOutgoingFriendRequestResponse mapeia addressee e createdAt", () => {
    const entity = FriendshipResponseMapperFixtures.outgoingRequest();

    const response =
      FriendshipResponseMapper.toOutgoingFriendRequestResponse(entity);

    expect(response).toEqual({
      id: 56,
      addressee: {
        id: 15,
        name: "Maria",
        email: "maria@example.com",
      },
      status: "pending",
      createdAt: "2026-01-03T00:00:00.000Z",
    });
  });

  it("REQ-8: toListOutgoingFriendRequestsResponse retorna array de solicitações", () => {
    const entities = [FriendshipResponseMapperFixtures.outgoingRequest()];

    const response =
      FriendshipResponseMapper.toListOutgoingFriendRequestsResponse(entities);

    expect(response).toHaveLength(1);
    expect(response[0]?.addressee.id).toBe(15);
  });

  it("REQ-9: toSearchUserByEmailResponse inclui relationshipStatus", () => {
    const result: SearchUserByEmailResult = {
      id: 12,
      name: "Maria",
      email: "maria@example.com",
      relationshipStatus: "pending_outgoing",
    };

    const response = FriendshipResponseMapper.toSearchUserByEmailResponse(result);

    expect(response).toEqual({
      id: 12,
      name: "Maria",
      email: "maria@example.com",
      relationshipStatus: "pending_outgoing",
    });
  });
});
