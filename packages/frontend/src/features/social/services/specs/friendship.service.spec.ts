import { movieClient } from "@/lib/api/movie-client";
import { FriendshipService } from "../friendship.service";

jest.mock("@/lib/api/movie-client", () => ({
  movieClient: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedPost = jest.mocked(movieClient.post);
const mockedGet = jest.mocked(movieClient.get);
const mockedDelete = jest.mocked(movieClient.delete);

class FriendshipServiceFixtures {
  static userPublic(overrides: Record<string, unknown> = {}) {
    return {
      id: 1,
      name: "Maria Silva",
      email: "maria@example.com",
      ...overrides,
    };
  }

  static friendRequestResponse(overrides: Record<string, unknown> = {}) {
    return {
      id: 10,
      requesterId: 1,
      addresseeId: 2,
      status: "pending",
      createdAt: "2026-01-15T10:00:00.000Z",
      updatedAt: "2026-01-15T10:00:00.000Z",
      ...overrides,
    };
  }

  static incomingFriendRequest(overrides: Record<string, unknown> = {}) {
    return {
      id: 20,
      requester: FriendshipServiceFixtures.userPublic(),
      status: "pending",
      createdAt: "2026-01-16T12:00:00.000Z",
      ...overrides,
    };
  }

  static outgoingFriendRequest(overrides: Record<string, unknown> = {}) {
    return {
      id: 30,
      addressee: FriendshipServiceFixtures.userPublic({ id: 3, name: "João" }),
      status: "pending",
      createdAt: "2026-01-17T14:00:00.000Z",
      ...overrides,
    };
  }

  static searchUserByEmailResponse(overrides: Record<string, unknown> = {}) {
    return {
      id: 5,
      name: "Pedro Santos",
      email: "pedro@example.com",
      relationshipStatus: "none",
      ...overrides,
    };
  }
}

describe("FriendshipService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("listFriends chama GET /social/friends", async () => {
    const friend = FriendshipServiceFixtures.userPublic();
    mockedGet.mockResolvedValue({ data: [friend] });

    const result = await FriendshipService.listFriends();

    expect(mockedGet).toHaveBeenCalledWith("/social/friends");
    expect(result).toEqual([friend]);
  });

  it("sendFriendRequest chama POST /social/friend-requests com email", async () => {
    const friendRequest = FriendshipServiceFixtures.friendRequestResponse();
    mockedPost.mockResolvedValue({ data: friendRequest });

    const result = await FriendshipService.sendFriendRequest("maria@example.com");

    expect(mockedPost).toHaveBeenCalledWith("/social/friend-requests", {
      email: "maria@example.com",
    });
    expect(result).toEqual(friendRequest);
  });

  it("acceptFriendRequest chama POST /social/friend-requests/:id/accept", async () => {
    const friendRequest = FriendshipServiceFixtures.friendRequestResponse({
      status: "accepted",
    });
    mockedPost.mockResolvedValue({ data: friendRequest });

    const result = await FriendshipService.acceptFriendRequest(10);

    expect(mockedPost).toHaveBeenCalledWith("/social/friend-requests/10/accept");
    expect(result.status).toBe("accepted");
  });

  it("rejectFriendRequest chama POST /social/friend-requests/:id/reject", async () => {
    const friendRequest = FriendshipServiceFixtures.friendRequestResponse({
      status: "rejected",
    });
    mockedPost.mockResolvedValue({ data: friendRequest });

    const result = await FriendshipService.rejectFriendRequest(10);

    expect(mockedPost).toHaveBeenCalledWith("/social/friend-requests/10/reject");
    expect(result.status).toBe("rejected");
  });

  it("cancelFriendRequest chama DELETE /social/friend-requests/:id", async () => {
    mockedDelete.mockResolvedValue({ data: undefined });

    await FriendshipService.cancelFriendRequest(10);

    expect(mockedDelete).toHaveBeenCalledWith("/social/friend-requests/10");
  });

  it("removeFriend chama DELETE /social/friends/:userId", async () => {
    mockedDelete.mockResolvedValue({ data: undefined });

    await FriendshipService.removeFriend(2);

    expect(mockedDelete).toHaveBeenCalledWith("/social/friends/2");
  });

  it("listIncomingFriendRequests chama GET /social/friend-requests/incoming", async () => {
    const incomingRequest = FriendshipServiceFixtures.incomingFriendRequest();
    mockedGet.mockResolvedValue({ data: [incomingRequest] });

    const result = await FriendshipService.listIncomingFriendRequests();

    expect(mockedGet).toHaveBeenCalledWith("/social/friend-requests/incoming");
    expect(result).toEqual([incomingRequest]);
  });

  it("listOutgoingFriendRequests chama GET /social/friend-requests/outgoing", async () => {
    const outgoingRequest = FriendshipServiceFixtures.outgoingFriendRequest();
    mockedGet.mockResolvedValue({ data: [outgoingRequest] });

    const result = await FriendshipService.listOutgoingFriendRequests();

    expect(mockedGet).toHaveBeenCalledWith("/social/friend-requests/outgoing");
    expect(result).toEqual([outgoingRequest]);
  });

  it("searchUserByEmail chama GET /social/users/search com query email", async () => {
    const searchResult = FriendshipServiceFixtures.searchUserByEmailResponse();
    mockedGet.mockResolvedValue({ data: searchResult });

    const result = await FriendshipService.searchUserByEmail("pedro@example.com");

    expect(mockedGet).toHaveBeenCalledWith(
      "/social/users/search?email=pedro%40example.com",
    );
    expect(result).toEqual(searchResult);
  });
});
