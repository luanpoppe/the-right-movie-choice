import { Logger } from "@/lib/logger/logger";
import type { FriendRequestEntity } from "../../domain/entities/friend-request.entity";
import { FriendRequestNotFoundException } from "../../domain/exceptions/friend-request-not-found.exception";
import type { IFriendRequestRepository } from "../../domain/repositories/friend-request.repository";

export class AcceptFriendRequestUseCase {
  constructor(
    private readonly friendRequestRepository: IFriendRequestRepository,
  ) {}

  async execute(
    addresseeId: number,
    friendRequestId: number,
  ): Promise<FriendRequestEntity> {
    const friendRequest =
      await this.friendRequestRepository.findById(friendRequestId);

    if (!friendRequest) {
      throw new FriendRequestNotFoundException(friendRequestId);
    }

    const isAddressee = friendRequest.addresseeId === addresseeId;
    const isPending = friendRequest.status === "pending";
    const canAccept = isAddressee && isPending;

    if (!canAccept) {
      throw new FriendRequestNotFoundException(friendRequestId);
    }

    const acceptedRequest = await this.friendRequestRepository.updateStatus(
      friendRequestId,
      "accepted",
    );

    Logger.info("Friend request accepted", {
      friendRequestId,
      addresseeId,
      requesterId: acceptedRequest.requesterId,
    });

    return acceptedRequest;
  }
}
