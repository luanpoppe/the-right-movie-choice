import { Logger } from "@/lib/logger/logger";
import type { IncomingFriendRequestEntity } from "../../domain/entities/friend-request.entity";
import type { IFriendRequestRepository } from "../../domain/repositories/friend-request.repository";

export class ListIncomingFriendRequestsUseCase {
  constructor(
    private readonly friendRequestRepository: IFriendRequestRepository,
  ) {}

  async execute(userId: number): Promise<IncomingFriendRequestEntity[]> {
    const incomingRequests =
      await this.friendRequestRepository.listIncomingPending(userId);

    Logger.info("Incoming friend requests listed", {
      userId,
      count: incomingRequests.length,
    });

    return incomingRequests;
  }
}
