import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FriendRequestEntity } from "../../../domain/entities/friend-request.entity";
import { FriendRequestNotFoundException } from "../../../domain/exceptions/friend-request-not-found.exception";
import type { IFriendRequestRepository } from "../../../domain/repositories/friend-request.repository";
import { CancelFriendRequestUseCase } from "../cancel-friend-request.use-case";

describe("CancelFriendRequestUseCase", () => {
  const requesterId = 7;
  const addresseeId = 15;
  const friendRequestId = 56;

  const pendingRequest: FriendRequestEntity = {
    id: friendRequestId,
    requesterId,
    addresseeId,
    status: "pending",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  let friendRequestRepository: IFriendRequestRepository;
  let useCase: CancelFriendRequestUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    friendRequestRepository = {
      findById: vi.fn().mockResolvedValue(pendingRequest),
      findLatestBetweenUsers: vi.fn(),
      createPending: vi.fn(),
      executeSendFriendRequest: vi.fn(),
      updateStatus: vi.fn(),
      deleteById: vi.fn().mockResolvedValue(undefined),
      deleteAllBetweenUsers: vi.fn(),
      listAcceptedFriends: vi.fn(),
      listIncomingPending: vi.fn(),
      listOutgoingPending: vi.fn(),
      resolveRelationshipStatus: vi.fn(),
    };

    useCase = new CancelFriendRequestUseCase(friendRequestRepository);
  });

  it("should delete a pending friend request sent by the requester", async () => {
    await useCase.execute(requesterId, friendRequestId);

    expect(friendRequestRepository.findById).toHaveBeenCalledWith(
      friendRequestId,
    );
    expect(friendRequestRepository.deleteById).toHaveBeenCalledWith(
      friendRequestId,
    );
  });

  it("should throw FriendRequestNotFoundException when request does not exist", async () => {
    vi.mocked(friendRequestRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute(requesterId, friendRequestId),
    ).rejects.toThrow(FriendRequestNotFoundException);
    expect(friendRequestRepository.deleteById).not.toHaveBeenCalled();
  });

  it("should throw FriendRequestNotFoundException when caller is not the requester", async () => {
    await expect(
      useCase.execute(addresseeId, friendRequestId),
    ).rejects.toThrow(FriendRequestNotFoundException);
    expect(friendRequestRepository.deleteById).not.toHaveBeenCalled();
  });

  it("should throw FriendRequestNotFoundException when request is not pending", async () => {
    vi.mocked(friendRequestRepository.findById).mockResolvedValue({
      ...pendingRequest,
      status: "accepted",
    });

    await expect(
      useCase.execute(requesterId, friendRequestId),
    ).rejects.toThrow(FriendRequestNotFoundException);
    expect(friendRequestRepository.deleteById).not.toHaveBeenCalled();
  });
});
