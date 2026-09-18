import {
  FriendRequestResponseSchema,
  IncomingFriendRequestResponseSchema,
  ListFriendsResponseSchema,
  ListIncomingFriendRequestsResponseSchema,
  ListOutgoingFriendRequestsResponseSchema,
  OutgoingFriendRequestResponseSchema,
  RelationshipStatusSchema,
  SearchUserByEmailResponseSchema,
  UserPublicSchema,
} from "../friendship.dto";

class FriendshipDtoFixtures {
  static userPublic(overrides?: Partial<{ id: number; name: string; email: string }>) {
    return {
      id: 1,
      name: "Maria Silva",
      email: "maria@example.com",
      ...overrides,
    };
  }

  static friendRequestResponse(
    overrides?: Partial<{
      id: number;
      requesterId: number;
      addresseeId: number;
      status: "pending" | "accepted" | "rejected";
      createdAt: string;
      updatedAt: string;
    }>,
  ) {
    return {
      id: 10,
      requesterId: 1,
      addresseeId: 2,
      status: "pending" as const,
      createdAt: "2026-01-15T10:00:00.000Z",
      updatedAt: "2026-01-15T10:00:00.000Z",
      ...overrides,
    };
  }

  static incomingFriendRequest(
    overrides?: Partial<{
      id: number;
      status: "pending" | "accepted" | "rejected";
      createdAt: string;
    }>,
  ) {
    return {
      id: 20,
      requester: FriendshipDtoFixtures.userPublic(),
      status: "pending" as const,
      createdAt: "2026-01-16T12:00:00.000Z",
      ...overrides,
    };
  }

  static outgoingFriendRequest(
    overrides?: Partial<{
      id: number;
      status: "pending" | "accepted" | "rejected";
      createdAt: string;
    }>,
  ) {
    return {
      id: 30,
      addressee: FriendshipDtoFixtures.userPublic({ id: 3, name: "João" }),
      status: "pending" as const,
      createdAt: "2026-01-17T14:00:00.000Z",
      ...overrides,
    };
  }
}

describe("UserPublicSchema", () => {
  it("aceita usuário público com id, name e email", () => {
    const user = FriendshipDtoFixtures.userPublic();

    const parsed = UserPublicSchema.parse(user);

    expect(parsed).toEqual(user);
  });

  it("rejeita id zero ou negativo", () => {
    const userWithInvalidId = FriendshipDtoFixtures.userPublic({ id: 0 });

    const parseResult = UserPublicSchema.safeParse(userWithInvalidId);

    expect(parseResult.success).toBe(false);
  });
});

describe("FriendRequestResponseSchema", () => {
  it("aceita solicitação com status pending, accepted ou rejected", () => {
    const pendingRequest = FriendshipDtoFixtures.friendRequestResponse();
    const acceptedRequest = FriendshipDtoFixtures.friendRequestResponse({
      status: "accepted",
    });

    expect(FriendRequestResponseSchema.parse(pendingRequest)).toEqual(
      pendingRequest,
    );
    expect(FriendRequestResponseSchema.parse(acceptedRequest).status).toBe(
      "accepted",
    );
  });

  it("rejeita status inválido", () => {
    const requestWithInvalidStatus = FriendshipDtoFixtures.friendRequestResponse({
      status: "cancelled" as "pending",
    });

    const parseResult = FriendRequestResponseSchema.safeParse(
      requestWithInvalidStatus,
    );

    expect(parseResult.success).toBe(false);
  });
});

describe("ListFriendsResponseSchema", () => {
  it("aceita lista vazia de amigos", () => {
    const parsed = ListFriendsResponseSchema.parse([]);

    expect(parsed).toEqual([]);
  });

  it("aceita lista com usuários públicos", () => {
    const friends = [
      FriendshipDtoFixtures.userPublic(),
      FriendshipDtoFixtures.userPublic({ id: 2, name: "Ana" }),
    ];

    const parsed = ListFriendsResponseSchema.parse(friends);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.email).toBe("maria@example.com");
  });
});

describe("IncomingFriendRequestResponseSchema", () => {
  it("aceita solicitação recebida com requester aninhado", () => {
    const incomingRequest = FriendshipDtoFixtures.incomingFriendRequest();

    const parsed = IncomingFriendRequestResponseSchema.parse(incomingRequest);

    expect(parsed.requester.name).toBe("Maria Silva");
    expect(parsed.status).toBe("pending");
  });

  it("rejeita item sem requester", () => {
    const requestWithoutRequester = {
      id: 20,
      status: "pending",
      createdAt: "2026-01-16T12:00:00.000Z",
    };

    const parseResult = IncomingFriendRequestResponseSchema.safeParse(
      requestWithoutRequester,
    );

    expect(parseResult.success).toBe(false);
  });
});

describe("ListIncomingFriendRequestsResponseSchema", () => {
  it("aceita array de solicitações recebidas", () => {
    const incomingRequests = [FriendshipDtoFixtures.incomingFriendRequest()];

    const parsed = ListIncomingFriendRequestsResponseSchema.parse(
      incomingRequests,
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.id).toBe(20);
  });
});

describe("OutgoingFriendRequestResponseSchema", () => {
  it("aceita solicitação enviada com addressee aninhado", () => {
    const outgoingRequest = FriendshipDtoFixtures.outgoingFriendRequest();

    const parsed = OutgoingFriendRequestResponseSchema.parse(outgoingRequest);

    expect(parsed.addressee.name).toBe("João");
    expect(parsed.id).toBe(30);
  });
});

describe("ListOutgoingFriendRequestsResponseSchema", () => {
  it("aceita array de solicitações enviadas", () => {
    const outgoingRequests = [FriendshipDtoFixtures.outgoingFriendRequest()];

    const parsed = ListOutgoingFriendRequestsResponseSchema.parse(
      outgoingRequests,
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.addressee.id).toBe(3);
  });
});

describe("SearchUserByEmailResponseSchema", () => {
  it("aceita usuário encontrado com relationshipStatus válido", () => {
    const relationshipStatuses = RelationshipStatusSchema.options;

    for (const relationshipStatus of relationshipStatuses) {
      const searchResult = {
        ...FriendshipDtoFixtures.userPublic(),
        relationshipStatus,
      };

      const parsed = SearchUserByEmailResponseSchema.parse(searchResult);

      expect(parsed.relationshipStatus).toBe(relationshipStatus);
    }
  });

  it("rejeita relationshipStatus ausente ou inválido", () => {
    const resultWithoutStatus = FriendshipDtoFixtures.userPublic();
    const resultWithInvalidStatus = {
      ...FriendshipDtoFixtures.userPublic(),
      relationshipStatus: "blocked",
    };

    expect(
      SearchUserByEmailResponseSchema.safeParse(resultWithoutStatus).success,
    ).toBe(false);
    expect(
      SearchUserByEmailResponseSchema.safeParse(resultWithInvalidStatus).success,
    ).toBe(false);
  });
});
