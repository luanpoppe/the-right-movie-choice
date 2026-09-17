import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserEntity } from "@/modules/users/domain/entities/user.entity";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import { SelfFriendRequestException } from "../../../domain/exceptions/self-friend-request.exception";
import { UserNotFoundByEmailException } from "../../../domain/exceptions/user-not-found-by-email.exception";
import type { IFriendRequestRepository } from "../../../domain/repositories/friend-request.repository";
import { SearchUserByEmailUseCase } from "../search-user-by-email.use-case";

describe("SearchUserByEmailUseCase", () => {
  const viewerUserId = 7;
  const targetUserId = 12;
  const email = "Maria@Example.com";

  const targetUser: UserEntity = {
    id: targetUserId,
    email: "maria@example.com",
    name: "Maria",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  let friendRequestRepository: IFriendRequestRepository;
  let userRepository: IUserRepository;
  let useCase: SearchUserByEmailUseCase;

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
      listOutgoingPending: vi.fn(),
      resolveRelationshipStatus: vi.fn().mockResolvedValue("none"),
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

    useCase = new SearchUserByEmailUseCase(
      friendRequestRepository,
      userRepository,
    );
  });

  it("REQ-9: should normalize email and return user with relationshipStatus", async () => {
    vi.mocked(friendRequestRepository.resolveRelationshipStatus).mockResolvedValue(
      "friends",
    );

    const result = await useCase.execute(viewerUserId, email);

    expect(userRepository.findByEmail).toHaveBeenCalledWith("maria@example.com");
    expect(
      friendRequestRepository.resolveRelationshipStatus,
    ).toHaveBeenCalledWith(viewerUserId, targetUserId);
    expect(result).toEqual({
      id: targetUserId,
      name: "Maria",
      email: "maria@example.com",
      relationshipStatus: "friends",
    });
  });

  it("REQ-9: should throw UserNotFoundByEmailException when user does not exist", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(useCase.execute(viewerUserId, email)).rejects.toThrow(
      UserNotFoundByEmailException,
    );
    expect(
      friendRequestRepository.resolveRelationshipStatus,
    ).not.toHaveBeenCalled();
  });

  it("REQ-9: should throw SelfFriendRequestException when searching own email", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue({
      ...targetUser,
      id: viewerUserId,
    });

    await expect(useCase.execute(viewerUserId, email)).rejects.toThrow(
      SelfFriendRequestException,
    );
    expect(
      friendRequestRepository.resolveRelationshipStatus,
    ).not.toHaveBeenCalled();
  });

  it("REQ-9: should return pending_outgoing relationshipStatus", async () => {
    vi.mocked(friendRequestRepository.resolveRelationshipStatus).mockResolvedValue(
      "pending_outgoing",
    );

    const result = await useCase.execute(viewerUserId, email);

    expect(result.relationshipStatus).toBe("pending_outgoing");
  });

  it("REQ-9: should return pending_incoming relationshipStatus", async () => {
    vi.mocked(friendRequestRepository.resolveRelationshipStatus).mockResolvedValue(
      "pending_incoming",
    );

    const result = await useCase.execute(viewerUserId, email);

    expect(result.relationshipStatus).toBe("pending_incoming");
  });
});
