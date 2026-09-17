import { Logger } from "@/lib/logger/logger";
import type { OutgoingFriendRequestEntity } from "../../domain/entities/friend-request.entity";
import type { IFriendRequestRepository } from "../../domain/repositories/friend-request.repository";

export class ListOutgoingFriendRequestsUseCase {
  constructor(
    private readonly friendRequestRepository: IFriendRequestRepository,
  ) {}

  async execute(userId: number): Promise<OutgoingFriendRequestEntity[]> {
    const outgoingRequests =
      await this.friendRequestRepository.listOutgoingPending(userId);

    Logger.info("Outgoing friend requests listed", {
      userId,
      count: outgoingRequests.length,
    });

    return outgoingRequests;
  }
}
