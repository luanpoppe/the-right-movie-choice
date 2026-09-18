import { Logger } from "@/lib/logger/logger";
import { FriendRequestNotFoundException } from "../../domain/exceptions/friend-request-not-found.exception";
import type { IFriendRequestRepository } from "../../domain/repositories/friend-request.repository";

export class CancelFriendRequestUseCase {
  constructor(
    private readonly friendRequestRepository: IFriendRequestRepository,
  ) {}

  async execute(requesterId: number, friendRequestId: number): Promise<void> {
    const friendRequest =
      await this.friendRequestRepository.findById(friendRequestId);

    if (!friendRequest) {
      throw new FriendRequestNotFoundException(friendRequestId);
    }

    const isRequester = friendRequest.requesterId === requesterId;
    const isPending = friendRequest.status === "pending";
    const canCancel = isRequester && isPending;

    if (!canCancel) {
      throw new FriendRequestNotFoundException(friendRequestId);
    }

    await this.friendRequestRepository.deleteById(friendRequestId);

    Logger.info("Friend request cancelled", {
      friendRequestId,
      requesterId,
      addresseeId: friendRequest.addresseeId,
    });
  }
}
