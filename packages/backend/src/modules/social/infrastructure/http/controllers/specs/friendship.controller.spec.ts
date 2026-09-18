import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyReply, FastifyRequest } from "fastify";
import type { FriendRequestEntity } from "@/modules/social/domain/entities/friend-request.entity";
import { FriendRequestNotFoundException } from "@/modules/social/domain/exceptions/friend-request-not-found.exception";
import { FriendRequestValidationException } from "@/modules/social/domain/exceptions/friend-request-validation.exception";
import { AcceptFriendRequestUseCase } from "@/modules/social/application/use-cases/accept-friend-request.use-case";
import { CancelFriendRequestUseCase } from "@/modules/social/application/use-cases/cancel-friend-request.use-case";
import { ListFriendsUseCase } from "@/modules/social/application/use-cases/list-friends.use-case";
import { ListIncomingFriendRequestsUseCase } from "@/modules/social/application/use-cases/list-incoming-friend-requests.use-case";
import { ListOutgoingFriendRequestsUseCase } from "@/modules/social/application/use-cases/list-outgoing-friend-requests.use-case";
import { RejectFriendRequestUseCase } from "@/modules/social/application/use-cases/reject-friend-request.use-case";
import { RemoveFriendUseCase } from "@/modules/social/application/use-cases/remove-friend.use-case";
import { SearchUserByEmailUseCase } from "@/modules/social/application/use-cases/search-user-by-email.use-case";
import { SendFriendRequestUseCase } from "@/modules/social/application/use-cases/send-friend-request.use-case";
import type {
  FriendRequestIdParams,
  FriendUserIdParams,
  SearchUserByEmailQuery,
  SendFriendRequestDTO,
} from "../../dto/friendship.dto";
import { FriendshipController } from "../friendship.controller";

class FriendshipControllerFixtures {
  static friendRequest(
    overrides: Partial<FriendRequestEntity> = {},
  ): FriendRequestEntity {
    return {
      id: 55,
      requesterId: 7,
      addresseeId: 12,
      status: "pending",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-01T10:00:00.000Z"),
      ...overrides,
    };
  }
}

function createReply(): FastifyReply {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
}

function createAuthRequest<T extends Record<string, unknown>>(
  request: T,
): T & { userMovieEntryAuth: { userId: number } } {
  return {
    ...request,
    userMovieEntryAuth: { userId: 7 },
  };
}

describe("FriendshipController", () => {
  let sendFriendRequestUseCase: SendFriendRequestUseCase;
  let acceptFriendRequestUseCase: AcceptFriendRequestUseCase;
  let rejectFriendRequestUseCase: RejectFriendRequestUseCase;
  let cancelFriendRequestUseCase: CancelFriendRequestUseCase;
  let removeFriendUseCase: RemoveFriendUseCase;
  let listFriendsUseCase: ListFriendsUseCase;
  let listIncomingFriendRequestsUseCase: ListIncomingFriendRequestsUseCase;
  let listOutgoingFriendRequestsUseCase: ListOutgoingFriendRequestsUseCase;
  let searchUserByEmailUseCase: SearchUserByEmailUseCase;
  let handlers: ReturnType<typeof FriendshipController.create>;

  beforeEach(() => {
    vi.clearAllMocks();

    sendFriendRequestUseCase = {
      execute: vi.fn(),
    } as unknown as SendFriendRequestUseCase;
    acceptFriendRequestUseCase = {
      execute: vi.fn(),
    } as unknown as AcceptFriendRequestUseCase;
    rejectFriendRequestUseCase = {
      execute: vi.fn(),
    } as unknown as RejectFriendRequestUseCase;
    cancelFriendRequestUseCase = {
      execute: vi.fn(),
    } as unknown as CancelFriendRequestUseCase;
    removeFriendUseCase = {
      execute: vi.fn(),
    } as unknown as RemoveFriendUseCase;
    listFriendsUseCase = {
      execute: vi.fn(),
    } as unknown as ListFriendsUseCase;
    listIncomingFriendRequestsUseCase = {
      execute: vi.fn(),
    } as unknown as ListIncomingFriendRequestsUseCase;
    listOutgoingFriendRequestsUseCase = {
      execute: vi.fn(),
    } as unknown as ListOutgoingFriendRequestsUseCase;
    searchUserByEmailUseCase = {
      execute: vi.fn(),
    } as unknown as SearchUserByEmailUseCase;

    handlers = FriendshipController.create({
      sendFriendRequestUseCase,
      acceptFriendRequestUseCase,
      rejectFriendRequestUseCase,
      cancelFriendRequestUseCase,
      removeFriendUseCase,
      listFriendsUseCase,
      listIncomingFriendRequestsUseCase,
      listOutgoingFriendRequestsUseCase,
      searchUserByEmailUseCase,
    });
  });

  it("sendFriendRequest happy path returns 201 with friend request", async () => {
    const friendRequest = FriendshipControllerFixtures.friendRequest();
    vi.mocked(sendFriendRequestUseCase.execute).mockResolvedValue(friendRequest);
    const request = createAuthRequest({
      body: { email: "maria@example.com" },
    }) as unknown as FastifyRequest<{ Body: SendFriendRequestDTO }>;
    const reply = createReply();

    await handlers.sendFriendRequest(request, reply);

    expect(sendFriendRequestUseCase.execute).toHaveBeenCalledWith(
      7,
      "maria@example.com",
    );
    expect(reply.status).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith({
      id: 55,
      requesterId: 7,
      addresseeId: 12,
      status: "pending",
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-01T10:00:00.000Z",
    });
  });

  it("acceptFriendRequest happy path returns 200 with accepted request", async () => {
    const friendRequest = FriendshipControllerFixtures.friendRequest({
      status: "accepted",
    });
    vi.mocked(acceptFriendRequestUseCase.execute).mockResolvedValue(
      friendRequest,
    );
    const request = createAuthRequest({
      params: { id: "55" },
    }) as unknown as FastifyRequest<{ Params: FriendRequestIdParams }>;
    const reply = createReply();

    await handlers.acceptFriendRequest(request, reply);

    expect(acceptFriendRequestUseCase.execute).toHaveBeenCalledWith(7, 55);
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ status: "accepted" }),
    );
  });

  it("rejectFriendRequest happy path returns 200 with rejected request", async () => {
    const friendRequest = FriendshipControllerFixtures.friendRequest({
      status: "rejected",
    });
    vi.mocked(rejectFriendRequestUseCase.execute).mockResolvedValue(
      friendRequest,
    );
    const request = createAuthRequest({
      params: { id: "55" },
    }) as unknown as FastifyRequest<{ Params: FriendRequestIdParams }>;
    const reply = createReply();

    await handlers.rejectFriendRequest(request, reply);

    expect(rejectFriendRequestUseCase.execute).toHaveBeenCalledWith(7, 55);
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ status: "rejected" }),
    );
  });

  it("cancelFriendRequest happy path returns 204", async () => {
    vi.mocked(cancelFriendRequestUseCase.execute).mockResolvedValue();
    const request = createAuthRequest({
      params: { id: "56" },
    }) as unknown as FastifyRequest<{ Params: FriendRequestIdParams }>;
    const reply = createReply();

    await handlers.cancelFriendRequest(request, reply);

    expect(cancelFriendRequestUseCase.execute).toHaveBeenCalledWith(7, 56);
    expect(reply.status).toHaveBeenCalledWith(204);
    expect(reply.send).toHaveBeenCalledWith();
  });

  it("removeFriend happy path returns 204", async () => {
    vi.mocked(removeFriendUseCase.execute).mockResolvedValue();
    const request = createAuthRequest({
      params: { userId: "12" },
    }) as unknown as FastifyRequest<{ Params: FriendUserIdParams }>;
    const reply = createReply();

    await handlers.removeFriend(request, reply);

    expect(removeFriendUseCase.execute).toHaveBeenCalledWith(7, 12);
    expect(reply.status).toHaveBeenCalledWith(204);
    expect(reply.send).toHaveBeenCalledWith();
  });

  it("listFriends happy path returns 200 with friends array", async () => {
    vi.mocked(listFriendsUseCase.execute).mockResolvedValue([
      { id: 12, name: "Maria", email: "maria@example.com" },
    ]);
    const request = createAuthRequest({}) as unknown as FastifyRequest;
    const reply = createReply();

    await handlers.listFriends(request, reply);

    expect(listFriendsUseCase.execute).toHaveBeenCalledWith(7);
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith([
      { id: 12, name: "Maria", email: "maria@example.com" },
    ]);
  });

  it("listOutgoingFriendRequests happy path returns 200 with ISO createdAt", async () => {
    vi.mocked(listOutgoingFriendRequestsUseCase.execute).mockResolvedValue([
      {
        id: 56,
        addressee: { id: 15, name: "João", email: "joao@example.com" },
        status: "pending",
        createdAt: new Date("2026-03-02T10:00:00.000Z"),
      },
    ]);
    const request = createAuthRequest({}) as unknown as FastifyRequest;
    const reply = createReply();

    await handlers.listOutgoingFriendRequests(request, reply);

    expect(listOutgoingFriendRequestsUseCase.execute).toHaveBeenCalledWith(7);
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith([
      {
        id: 56,
        addressee: { id: 15, name: "João", email: "joao@example.com" },
        status: "pending",
        createdAt: "2026-03-02T10:00:00.000Z",
      },
    ]);
  });

  it("listIncomingFriendRequests happy path returns 200 with ISO createdAt", async () => {
    vi.mocked(listIncomingFriendRequestsUseCase.execute).mockResolvedValue([
      {
        id: 55,
        requester: { id: 12, name: "Maria", email: "maria@example.com" },
        status: "pending",
        createdAt: new Date("2026-03-01T10:00:00.000Z"),
      },
    ]);
    const request = createAuthRequest({}) as unknown as FastifyRequest;
    const reply = createReply();

    await handlers.listIncomingFriendRequests(request, reply);

    expect(listIncomingFriendRequestsUseCase.execute).toHaveBeenCalledWith(7);
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith([
      {
        id: 55,
        requester: { id: 12, name: "Maria", email: "maria@example.com" },
        status: "pending",
        createdAt: "2026-03-01T10:00:00.000Z",
      },
    ]);
  });

  it("searchUserByEmail happy path returns 200 with relationshipStatus", async () => {
    vi.mocked(searchUserByEmailUseCase.execute).mockResolvedValue({
      id: 12,
      name: "Maria",
      email: "maria@example.com",
      relationshipStatus: "none",
    });
    const request = createAuthRequest({
      query: { email: "maria@example.com" },
    }) as unknown as FastifyRequest<{ Querystring: SearchUserByEmailQuery }>;
    const reply = createReply();

    await handlers.searchUserByEmail(request, reply);

    expect(searchUserByEmailUseCase.execute).toHaveBeenCalledWith(
      7,
      "maria@example.com",
    );
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      id: 12,
      name: "Maria",
      email: "maria@example.com",
      relationshipStatus: "none",
    });
  });

  it("acceptFriendRequest propagates FriendRequestNotFoundException", async () => {
    const notFoundError = new FriendRequestNotFoundException(55);
    vi.mocked(acceptFriendRequestUseCase.execute).mockRejectedValue(
      notFoundError,
    );
    const request = createAuthRequest({
      params: { id: "55" },
    }) as unknown as FastifyRequest<{ Params: FriendRequestIdParams }>;
    const reply = createReply();

    await expect(handlers.acceptFriendRequest(request, reply)).rejects.toThrow(
      FriendRequestNotFoundException,
    );
  });

  it("rejects invalid friend request id before calling use case", async () => {
    const request = createAuthRequest({
      params: { id: "0" },
    }) as unknown as FastifyRequest<{ Params: FriendRequestIdParams }>;
    const reply = createReply();

    await expect(handlers.acceptFriendRequest(request, reply)).rejects.toBeInstanceOf(
      FriendRequestValidationException,
    );
    expect(acceptFriendRequestUseCase.execute).not.toHaveBeenCalled();
  });

  it("throws validation exception when auth context is missing", async () => {
    const request = {} as FastifyRequest;
    const reply = createReply();

    await expect(handlers.listFriends(request, reply)).rejects.toBeInstanceOf(
      FriendRequestValidationException,
    );
    expect(listFriendsUseCase.execute).not.toHaveBeenCalled();
  });

  it("uses userId from auth context instead of any client input", async () => {
    vi.mocked(listFriendsUseCase.execute).mockResolvedValue([]);
    const request = createAuthRequest({}) as unknown as FastifyRequest;
    const reply = createReply();

    await handlers.listFriends(request, reply);

    const [calledUserId] = vi.mocked(listFriendsUseCase.execute).mock.calls[0]!;

    expect(calledUserId).toBe(7);
  });
});
