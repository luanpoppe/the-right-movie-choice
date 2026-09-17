import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IncomingFriendRequestEntity } from "../../../domain/entities/friend-request.entity";
import type { IFriendRequestRepository } from "../../../domain/repositories/friend-request.repository";
import { ListIncomingFriendRequestsUseCase } from "../list-incoming-friend-requests.use-case";

describe("ListIncomingFriendRequestsUseCase", () => {
  const userId = 7;

  const incomingRequests: IncomingFriendRequestEntity[] = [
    {
      id: 55,
      requester: { id: 12, name: "Maria", email: "maria@example.com" },
      status: "pending",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
    },
    {
      id: 56,
      requester: { id: 20, name: "Ana", email: "ana@example.com" },
      status: "pending",
      createdAt: new Date("2026-03-02T10:00:00.000Z"),
    },
  ];

  let friendRequestRepository: IFriendRequestRepository;
  let useCase: ListIncomingFriendRequestsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    friendRequestRepository = {
      findById: vi.fn(),
      findLatestBetweenUsers: vi.fn(),
      createPending: vi.fn(),
      executeSendFriendRequest: vi.fn(),
      updateStatus: vi.fn(),
      deleteById: vi.fn(),
      deleteAllBetweenUsers: vi.fn(),
      listAcceptedFriends: vi.fn(),
      listIncomingPending: vi.fn().mockResolvedValue(incomingRequests),
      listOutgoingPending: vi.fn(),
      resolveRelationshipStatus: vi.fn(),
    };

    useCase = new ListIncomingFriendRequestsUseCase(friendRequestRepository);
  });

  it("REQ-7: should return pending incoming requests where user is addressee", async () => {
    const result = await useCase.execute(userId);

    expect(friendRequestRepository.listIncomingPending).toHaveBeenCalledWith(
      userId,
    );
    expect(result).toEqual(incomingRequests);
    expect(result).toHaveLength(2);

    const firstRequest = result[0];
    expect(firstRequest).toBeDefined();
    expect(firstRequest!.requester.id).toBe(12);
    expect(firstRequest!.status).toBe("pending");
  });

  it("REQ-7: should return empty array when there are no incoming requests", async () => {
    vi.mocked(friendRequestRepository.listIncomingPending).mockResolvedValue(
      [],
    );

    const result = await useCase.execute(userId);

    expect(result).toEqual([]);
  });
});
