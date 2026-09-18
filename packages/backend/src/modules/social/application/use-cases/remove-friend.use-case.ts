import { Logger } from "@/lib/logger/logger";
import { FriendRequestNotFoundException } from "../../domain/exceptions/friend-request-not-found.exception";
import type { IFriendRequestRepository } from "../../domain/repositories/friend-request.repository";

export class RemoveFriendUseCase {
  constructor(
    private readonly friendRequestRepository: IFriendRequestRepository,
  ) {}

  async execute(userId: number, friendUserId: number): Promise<void> {
    const latestRequest =
      await this.friendRequestRepository.findLatestBetweenUsers(
        userId,
        friendUserId,
      );

    const isAcceptedFriendship = latestRequest?.status === "accepted";

    if (!isAcceptedFriendship) {
      throw new FriendRequestNotFoundException(friendUserId);
    }

    await this.friendRequestRepository.deleteAllBetweenUsers(
      userId,
      friendUserId,
    );

    Logger.info("Friendship removed", {
      userId,
      friendUserId,
    });
  }
}
