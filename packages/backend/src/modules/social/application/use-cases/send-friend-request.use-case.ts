import { Logger } from "@/lib/logger/logger";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import type { FriendRequestEntity } from "../../domain/entities/friend-request.entity";
import { AlreadyFriendsException } from "../../domain/exceptions/already-friends.exception";
import { FriendRequestAlreadyPendingException } from "../../domain/exceptions/friend-request-already-pending.exception";
import { SelfFriendRequestException } from "../../domain/exceptions/self-friend-request.exception";
import { UserNotFoundByEmailException } from "../../domain/exceptions/user-not-found-by-email.exception";
import type { IFriendRequestRepository } from "../../domain/repositories/friend-request.repository";
import { FriendRequestValidationUtils } from "../../domain/utils/friend-request-validation.utils";

export class SendFriendRequestUseCase {
  constructor(
    private readonly friendRequestRepository: IFriendRequestRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    requesterId: number,
    email: string,
  ): Promise<FriendRequestEntity> {
    const normalizedEmail = FriendRequestValidationUtils.normalizeEmail(email);

    const targetUser = await this.userRepository.findByEmail(normalizedEmail);

    if (!targetUser) {
      throw new UserNotFoundByEmailException(normalizedEmail);
    }

    const targetUserId = targetUser.id;
    const isSelfRequest = requesterId === targetUserId;

    if (isSelfRequest) {
      throw new SelfFriendRequestException();
    }

    const latestRequest =
      await this.friendRequestRepository.findLatestBetweenUsers(
        requesterId,
        targetUserId,
      );

    if (!latestRequest) {
      const createdRequest = await this.friendRequestRepository.createPending(
        requesterId,
        targetUserId,
      );

      Logger.info("Friend request sent", {
        friendRequestId: createdRequest.id,
        requesterId,
        addresseeId: targetUserId,
      });

      return createdRequest;
    }

    const isAlreadyFriends = latestRequest.status === "accepted";

    if (isAlreadyFriends) {
      throw new AlreadyFriendsException();
    }

    const isPending = latestRequest.status === "pending";

    if (isPending) {
      const isOutgoingFromRequester = latestRequest.requesterId === requesterId;

      if (isOutgoingFromRequester) {
        throw new FriendRequestAlreadyPendingException();
      }

      const acceptedRequest = await this.friendRequestRepository.updateStatus(
        latestRequest.id,
        "accepted",
      );

      Logger.info("Friend request auto-accepted (cross-request)", {
        friendRequestId: acceptedRequest.id,
        requesterId,
        addresseeId: targetUserId,
      });

      return acceptedRequest;
    }

    const createdRequest = await this.friendRequestRepository.createPending(
      requesterId,
      targetUserId,
    );

    Logger.info("Friend request sent after previous rejection", {
      friendRequestId: createdRequest.id,
      requesterId,
      addresseeId: targetUserId,
    });

    return createdRequest;
  }
}
