import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserEntity } from "@/modules/users/domain/entities/user.entity";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import type { FriendRequestEntity } from "../../../domain/entities/friend-request.entity";
import { SelfFriendRequestException } from "../../../domain/exceptions/self-friend-request.exception";
import { UserNotFoundByEmailException } from "../../../domain/exceptions/user-not-found-by-email.exception";
import type { IFriendRequestRepository } from "../../../domain/repositories/friend-request.repository";
import { SendFriendRequestUseCase } from "../send-friend-request.use-case";

describe("SendFriendRequestUseCase", () => {
  const requesterId = 7;
  const targetUserId = 12;
  const email = "Maria@Example.com";

  const targetUser: UserEntity = {
    id: targetUserId,
    email: "Maria@Example.com",
    name: "Maria",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  const pendingRequest: FriendRequestEntity = {
    id: 55,
    requesterId,
    addresseeId: targetUserId,
    status: "pending",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  };

  let friendRequestRepository: IFriendRequestRepository;
  let userRepository: IUserRepository;
  let useCase: SendFriendRequestUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    friendRequestRepository = {
      findById: vi.fn(),
      findLatestBetweenUsers: vi.fn(),
      createPending: vi.fn(),
      executeSendFriendRequest: vi.fn().mockResolvedValue(pendingRequest),
      updateStatus: vi.fn(),
      deleteById: vi.fn(),
      deleteAllBetweenUsers: vi.fn(),
      listAcceptedFriends: vi.fn(),
      listIncomingPending: vi.fn(),
      listOutgoingPending: vi.fn(),
      resolveRelationshipStatus: vi.fn(),
    };

    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByEmailCaseInsensitive: vi.fn().mockResolvedValue(targetUser),
      findByGoogleId: vi.fn(),
      findAuthByEmail: vi.fn(),
      create: vi.fn(),
      createWithGoogle: vi.fn(),
      linkGoogleAccount: vi.fn(),
      setPasswordHash: vi.fn(),
    };

    useCase = new SendFriendRequestUseCase(
      friendRequestRepository,
      userRepository,
    );
  });

  it("should normalize email and delegate send to repository", async () => {
    const result = await useCase.execute(requesterId, email);

    expect(userRepository.findByEmailCaseInsensitive).toHaveBeenCalledWith(
      "maria@example.com",
    );
    expect(friendRequestRepository.executeSendFriendRequest).toHaveBeenCalledWith(
      requesterId,
      targetUserId,
    );
    expect(result).toEqual(pendingRequest);
  });

  it("should throw UserNotFoundByEmailException when target user does not exist", async () => {
    vi.mocked(userRepository.findByEmailCaseInsensitive).mockResolvedValue(null);

    await expect(useCase.execute(requesterId, email)).rejects.toThrow(
      UserNotFoundByEmailException,
    );
    expect(friendRequestRepository.executeSendFriendRequest).not.toHaveBeenCalled();
  });

  it("should throw SelfFriendRequestException when requester targets own email", async () => {
    vi.mocked(userRepository.findByEmailCaseInsensitive).mockResolvedValue({
      ...targetUser,
      id: requesterId,
    });

    await expect(useCase.execute(requesterId, email)).rejects.toThrow(
      SelfFriendRequestException,
    );
    expect(friendRequestRepository.executeSendFriendRequest).not.toHaveBeenCalled();
  });
});
