import { Logger } from "@/lib/logger/logger";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import type { FriendRequestEntity } from "../../domain/entities/friend-request.entity";
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

    const targetUser =
      await this.userRepository.findByEmailCaseInsensitive(normalizedEmail);

    if (!targetUser) {
      throw new UserNotFoundByEmailException(normalizedEmail);
    }

    const targetUserId = targetUser.id;
    const isSelfRequest = requesterId === targetUserId;

    if (isSelfRequest) {
      throw new SelfFriendRequestException();
    }

    const createdRequest =
      await this.friendRequestRepository.executeSendFriendRequest(
        requesterId,
        targetUserId,
      );

    Logger.info("Friend request sent", {
      friendRequestId: createdRequest.id,
      requesterId,
      addresseeId: targetUserId,
      status: createdRequest.status,
    });

    return createdRequest;
  }
}
