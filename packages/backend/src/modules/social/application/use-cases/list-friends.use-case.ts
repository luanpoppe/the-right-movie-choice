import { Logger } from "@/lib/logger/logger";
import type { UserPublicEntity } from "../../domain/entities/friend-request.entity";
import type { IFriendRequestRepository } from "../../domain/repositories/friend-request.repository";

export class ListFriendsUseCase {
  constructor(
    private readonly friendRequestRepository: IFriendRequestRepository,
  ) {}

  async execute(userId: number): Promise<UserPublicEntity[]> {
    const friends =
      await this.friendRequestRepository.listAcceptedFriends(userId);

    Logger.info("Friends listed", {
      userId,
      count: friends.length,
    });

    return friends;
  }
}
