import { Logger } from "@/lib/logger/logger";
import type { UserPublicEntity } from "../../domain/entities/friend-request.entity";
import { NotGroupMemberException } from "../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../domain/exceptions/user-group-not-found.exception";
import type { IFriendRequestRepository } from "../../domain/repositories/friend-request.repository";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export class SuggestGroupFriendsUseCase {
  constructor(
    private readonly userGroupRepository: IUserGroupRepository,
    private readonly friendRequestRepository: IFriendRequestRepository,
  ) {}

  async execute(userId: number, groupId: number): Promise<UserPublicEntity[]> {
    UserGroupValidationUtils.assertValidUserId(userId);
    UserGroupValidationUtils.assertValidGroupId(groupId);

    const group = await this.userGroupRepository.findById(groupId);

    if (!group) {
      throw new UserGroupNotFoundException(groupId);
    }

    const membership = await this.userGroupRepository.findMembership(
      groupId,
      userId,
    );

    if (!membership) {
      throw new NotGroupMemberException(groupId);
    }

    const acceptedFriends =
      await this.friendRequestRepository.listAcceptedFriends(userId);

    const memberUserIds =
      await this.userGroupRepository.findMemberUserIds(groupId);
    const memberIdSet = new Set(memberUserIds);

    const suggestions: UserPublicEntity[] = [];

    for (const friend of acceptedFriends) {
      const isSelf = friend.id === userId;

      if (isSelf) {
        continue;
      }

      const isAlreadyMember = memberIdSet.has(friend.id);

      if (isAlreadyMember) {
        continue;
      }

      suggestions.push(friend);
    }

    Logger.info("Group friend suggestions listed", {
      groupId,
      userId,
      count: suggestions.length,
    });

    return suggestions;
  }
}
