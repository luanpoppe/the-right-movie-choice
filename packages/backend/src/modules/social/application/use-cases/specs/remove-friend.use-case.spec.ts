import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FriendRequestEntity } from "../../../domain/entities/friend-request.entity";
import { FriendRequestNotFoundException } from "../../../domain/exceptions/friend-request-not-found.exception";
import type { IFriendRequestRepository } from "../../../domain/repositories/friend-request.repository";
import { RemoveFriendUseCase } from "../remove-friend.use-case";

describe("RemoveFriendUseCase", () => {
  const userId = 7;
  const friendUserId = 12;
  const friendRequestId = 80;

  const acceptedRequest: FriendRequestEntity = {
    id: friendRequestId,
    requesterId: userId,
    addresseeId: friendUserId,
    status: "accepted",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  let friendRequestRepository: IFriendRequestRepository;
  let useCase: RemoveFriendUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    friendRequestRepository = {
      findById: vi.fn(),
      findLatestBetweenUsers: vi.fn().mockResolvedValue(acceptedRequest),
      createPending: vi.fn(),
      executeSendFriendRequest: vi.fn(),
      updateStatus: vi.fn(),
      deleteById: vi.fn(),
      deleteAllBetweenUsers: vi.fn().mockResolvedValue(undefined),
      listAcceptedFriends: vi.fn(),
      listIncomingPending: vi.fn(),
      listOutgoingPending: vi.fn(),
      resolveRelationshipStatus: vi.fn(),
    };

    useCase = new RemoveFriendUseCase(friendRequestRepository);
  });

  it("should delete all friendship records between the users", async () => {
    await useCase.execute(userId, friendUserId);

    expect(friendRequestRepository.findLatestBetweenUsers).toHaveBeenCalledWith(
      userId,
      friendUserId,
    );
    expect(friendRequestRepository.deleteAllBetweenUsers).toHaveBeenCalledWith(
      userId,
      friendUserId,
    );
  });

  it("should throw FriendRequestNotFoundException when no relationship exists", async () => {
    vi.mocked(friendRequestRepository.findLatestBetweenUsers).mockResolvedValue(
      null,
    );

    await expect(useCase.execute(userId, friendUserId)).rejects.toThrow(
      FriendRequestNotFoundException,
    );
    expect(friendRequestRepository.deleteAllBetweenUsers).not.toHaveBeenCalled();
  });

  it("should throw FriendRequestNotFoundException when latest relationship is not accepted", async () => {
    vi.mocked(friendRequestRepository.findLatestBetweenUsers).mockResolvedValue({
      ...acceptedRequest,
      status: "pending",
    });

    await expect(useCase.execute(userId, friendUserId)).rejects.toThrow(
      FriendRequestNotFoundException,
    );
    expect(friendRequestRepository.deleteAllBetweenUsers).not.toHaveBeenCalled();
  });
});
