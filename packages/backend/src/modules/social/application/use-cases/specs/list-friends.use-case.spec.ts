import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserPublicEntity } from "../../../domain/entities/friend-request.entity";
import type { IFriendRequestRepository } from "../../../domain/repositories/friend-request.repository";
import { ListFriendsUseCase } from "../list-friends.use-case";

describe("ListFriendsUseCase", () => {
  const userId = 7;

  const friends: UserPublicEntity[] = [
    { id: 12, name: "Maria", email: "maria@example.com" },
    { id: 15, name: "João", email: "joao@example.com" },
  ];

  let friendRequestRepository: IFriendRequestRepository;
  let useCase: ListFriendsUseCase;

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
      listAcceptedFriends: vi.fn().mockResolvedValue(friends),
      listIncomingPending: vi.fn(),
      listOutgoingPending: vi.fn(),
      resolveRelationshipStatus: vi.fn(),
    };

    useCase = new ListFriendsUseCase(friendRequestRepository);
  });

  it("REQ-6: should return accepted friends as UserPublicEntity[]", async () => {
    const result = await useCase.execute(userId);

    expect(friendRequestRepository.listAcceptedFriends).toHaveBeenCalledWith(
      userId,
    );
    expect(result).toEqual(friends);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 12,
      name: "Maria",
      email: "maria@example.com",
    });
  });

  it("REQ-6: should return empty array when user has no friends", async () => {
    vi.mocked(friendRequestRepository.listAcceptedFriends).mockResolvedValue(
      [],
    );

    const result = await useCase.execute(userId);

    expect(result).toEqual([]);
  });
});
