import { describe, it, expect, vi, beforeEach } from "vitest";
import type { OutgoingFriendRequestEntity } from "../../../domain/entities/friend-request.entity";
import type { IFriendRequestRepository } from "../../../domain/repositories/friend-request.repository";
import { ListOutgoingFriendRequestsUseCase } from "../list-outgoing-friend-requests.use-case";

describe("ListOutgoingFriendRequestsUseCase", () => {
  const userId = 7;

  const outgoingRequests: OutgoingFriendRequestEntity[] = [
    {
      id: 60,
      addressee: { id: 15, name: "João", email: "joao@example.com" },
      status: "pending",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
    },
    {
      id: 61,
      addressee: { id: 18, name: "Pedro", email: "pedro@example.com" },
      status: "pending",
      createdAt: new Date("2026-03-02T10:00:00.000Z"),
    },
  ];

  let friendRequestRepository: IFriendRequestRepository;
  let useCase: ListOutgoingFriendRequestsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    friendRequestRepository = {
      findById: vi.fn(),
      findLatestBetweenUsers: vi.fn(),
      createPending: vi.fn(),
      updateStatus: vi.fn(),
      deleteById: vi.fn(),
      listAcceptedFriends: vi.fn(),
      listIncomingPending: vi.fn(),
      listOutgoingPending: vi.fn().mockResolvedValue(outgoingRequests),
      resolveRelationshipStatus: vi.fn(),
    };

    useCase = new ListOutgoingFriendRequestsUseCase(friendRequestRepository);
  });

  it("REQ-8: should return pending outgoing requests where user is requester", async () => {
    const result = await useCase.execute(userId);

    expect(friendRequestRepository.listOutgoingPending).toHaveBeenCalledWith(
      userId,
    );
    expect(result).toEqual(outgoingRequests);
    expect(result).toHaveLength(2);

    const firstRequest = result[0];
    expect(firstRequest).toBeDefined();
    expect(firstRequest!.addressee.id).toBe(15);
    expect(firstRequest!.status).toBe("pending");
  });

  it("REQ-8: should return empty array when there are no outgoing requests", async () => {
    vi.mocked(friendRequestRepository.listOutgoingPending).mockResolvedValue(
      [],
    );

    const result = await useCase.execute(userId);

    expect(result).toEqual([]);
  });
});
