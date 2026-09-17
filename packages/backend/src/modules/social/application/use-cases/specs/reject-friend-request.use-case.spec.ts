import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FriendRequestEntity } from "../../../domain/entities/friend-request.entity";
import { FriendRequestNotFoundException } from "../../../domain/exceptions/friend-request-not-found.exception";
import type { IFriendRequestRepository } from "../../../domain/repositories/friend-request.repository";
import { RejectFriendRequestUseCase } from "../reject-friend-request.use-case";

describe("RejectFriendRequestUseCase", () => {
  const addresseeId = 7;
  const requesterId = 12;
  const friendRequestId = 55;

  const pendingRequest: FriendRequestEntity = {
    id: friendRequestId,
    requesterId,
    addresseeId,
    status: "pending",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  let friendRequestRepository: IFriendRequestRepository;
  let useCase: RejectFriendRequestUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    friendRequestRepository = {
      findById: vi.fn().mockResolvedValue(pendingRequest),
      findLatestBetweenUsers: vi.fn(),
      createPending: vi.fn(),
      executeSendFriendRequest: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue({
        ...pendingRequest,
        status: "rejected",
      }),
      deleteById: vi.fn(),
      deleteAllBetweenUsers: vi.fn(),
      listAcceptedFriends: vi.fn(),
      listIncomingPending: vi.fn(),
      listOutgoingPending: vi.fn(),
      resolveRelationshipStatus: vi.fn(),
    };

    useCase = new RejectFriendRequestUseCase(friendRequestRepository);
  });

  it("should reject a pending friend request for the addressee", async () => {
    const result = await useCase.execute(addresseeId, friendRequestId);

    expect(friendRequestRepository.findById).toHaveBeenCalledWith(
      friendRequestId,
    );
    expect(friendRequestRepository.updateStatus).toHaveBeenCalledWith(
      friendRequestId,
      "rejected",
    );
    expect(result.status).toBe("rejected");
  });

  it("should throw FriendRequestNotFoundException when request does not exist", async () => {
    vi.mocked(friendRequestRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute(addresseeId, friendRequestId),
    ).rejects.toThrow(FriendRequestNotFoundException);
    expect(friendRequestRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("should throw FriendRequestNotFoundException when caller is not the addressee", async () => {
    await expect(
      useCase.execute(requesterId, friendRequestId),
    ).rejects.toThrow(FriendRequestNotFoundException);
    expect(friendRequestRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("should throw FriendRequestNotFoundException when request is not pending", async () => {
    vi.mocked(friendRequestRepository.findById).mockResolvedValue({
      ...pendingRequest,
      status: "rejected",
    });

    await expect(
      useCase.execute(addresseeId, friendRequestId),
    ).rejects.toThrow(FriendRequestNotFoundException);
    expect(friendRequestRepository.updateStatus).not.toHaveBeenCalled();
  });
});
