import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserEntity } from "@/modules/users/domain/entities/user.entity";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import type { FriendRequestEntity } from "../../../domain/entities/friend-request.entity";
import { AlreadyFriendsException } from "../../../domain/exceptions/already-friends.exception";
import { FriendRequestAlreadyPendingException } from "../../../domain/exceptions/friend-request-already-pending.exception";
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
    email: "maria@example.com",
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
      findLatestBetweenUsers: vi.fn().mockResolvedValue(null),
      createPending: vi.fn().mockResolvedValue(pendingRequest),
      updateStatus: vi.fn(),
      deleteById: vi.fn(),
      listAcceptedFriends: vi.fn(),
      listIncomingPending: vi.fn(),
      listOutgoingPending: vi.fn(),
      resolveRelationshipStatus: vi.fn(),
    };

    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(targetUser),
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

  it("should normalize email and create a pending friend request", async () => {
    const result = await useCase.execute(requesterId, email);

    expect(userRepository.findByEmail).toHaveBeenCalledWith("maria@example.com");
    expect(friendRequestRepository.findLatestBetweenUsers).toHaveBeenCalledWith(
      requesterId,
      targetUserId,
    );
    expect(friendRequestRepository.createPending).toHaveBeenCalledWith(
      requesterId,
      targetUserId,
    );
    expect(result).toEqual(pendingRequest);
  });

  it("should throw UserNotFoundByEmailException when target user does not exist", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(useCase.execute(requesterId, email)).rejects.toThrow(
      UserNotFoundByEmailException,
    );
    expect(friendRequestRepository.createPending).not.toHaveBeenCalled();
  });

  it("should throw SelfFriendRequestException when requester targets own email", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue({
      ...targetUser,
      id: requesterId,
    });

    await expect(useCase.execute(requesterId, email)).rejects.toThrow(
      SelfFriendRequestException,
    );
    expect(friendRequestRepository.findLatestBetweenUsers).not.toHaveBeenCalled();
  });

  it("should throw AlreadyFriendsException when users are already friends", async () => {
    vi.mocked(friendRequestRepository.findLatestBetweenUsers).mockResolvedValue({
      ...pendingRequest,
      status: "accepted",
    });

    await expect(useCase.execute(requesterId, email)).rejects.toThrow(
      AlreadyFriendsException,
    );
    expect(friendRequestRepository.createPending).not.toHaveBeenCalled();
  });

  it("should throw FriendRequestAlreadyPendingException when outgoing request is already pending", async () => {
    vi.mocked(friendRequestRepository.findLatestBetweenUsers).mockResolvedValue(
      pendingRequest,
    );

    await expect(useCase.execute(requesterId, email)).rejects.toThrow(
      FriendRequestAlreadyPendingException,
    );
    expect(friendRequestRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("should auto-accept when a cross-request is pending from target to requester", async () => {
    const crossRequest: FriendRequestEntity = {
      ...pendingRequest,
      requesterId: targetUserId,
      addresseeId: requesterId,
    };
    const acceptedRequest: FriendRequestEntity = {
      ...crossRequest,
      status: "accepted",
    };

    vi.mocked(friendRequestRepository.findLatestBetweenUsers).mockResolvedValue(
      crossRequest,
    );
    vi.mocked(friendRequestRepository.updateStatus).mockResolvedValue(
      acceptedRequest,
    );

    const result = await useCase.execute(requesterId, email);

    expect(friendRequestRepository.updateStatus).toHaveBeenCalledWith(
      crossRequest.id,
      "accepted",
    );
    expect(friendRequestRepository.createPending).not.toHaveBeenCalled();
    expect(result).toEqual(acceptedRequest);
  });

  it("should create a new pending request after a previous rejection", async () => {
    vi.mocked(friendRequestRepository.findLatestBetweenUsers).mockResolvedValue({
      ...pendingRequest,
      status: "rejected",
    });

    const result = await useCase.execute(requesterId, email);

    expect(friendRequestRepository.createPending).toHaveBeenCalledWith(
      requesterId,
      targetUserId,
    );
    expect(result).toEqual(pendingRequest);
  });
});
