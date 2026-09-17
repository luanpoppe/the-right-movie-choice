import { Logger } from "@/lib/logger/logger";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import { SelfFriendRequestException } from "../../domain/exceptions/self-friend-request.exception";
import { UserNotFoundByEmailException } from "../../domain/exceptions/user-not-found-by-email.exception";
import type { IFriendRequestRepository } from "../../domain/repositories/friend-request.repository";
import type { RelationshipStatus } from "../../domain/types/relationship-status.type";
import { FriendRequestValidationUtils } from "../../domain/utils/friend-request-validation.utils";

export type SearchUserByEmailResult = {
  id: number;
  name: string;
  email: string;
  relationshipStatus: RelationshipStatus;
};

export class SearchUserByEmailUseCase {
  constructor(
    private readonly friendRequestRepository: IFriendRequestRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    viewerUserId: number,
    email: string,
  ): Promise<SearchUserByEmailResult> {
    const normalizedEmail = FriendRequestValidationUtils.normalizeEmail(email);

    const foundUser = await this.userRepository.findByEmail(normalizedEmail);

    if (!foundUser) {
      throw new UserNotFoundByEmailException(normalizedEmail);
    }

    const foundUserId = foundUser.id;
    const isSelfSearch = viewerUserId === foundUserId;

    if (isSelfSearch) {
      throw new SelfFriendRequestException();
    }

    const relationshipStatus =
      await this.friendRequestRepository.resolveRelationshipStatus(
        viewerUserId,
        foundUserId,
      );

    Logger.info("User searched by email", {
      viewerUserId,
      foundUserId,
      relationshipStatus,
    });

    return {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      relationshipStatus,
    };
  }
}
