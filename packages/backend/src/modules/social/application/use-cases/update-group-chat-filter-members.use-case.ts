import { Logger } from "@/lib/logger/logger";
import type { GroupChatEntity } from "../../domain/entities/group-chat.entity";
import { GroupChatInvalidFilterMemberUserIdsException } from "../../domain/exceptions/group-chat-invalid-filter-member-user-ids.exception";
import { GroupChatNotFoundException } from "../../domain/exceptions/group-chat-not-found.exception";
import { NotGroupMemberException } from "../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../domain/exceptions/user-group-not-found.exception";
import { GroupChatValidationUtils } from "../../domain/group-chat-validation.utils";
import type { IGroupChatRepository } from "../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export class UpdateGroupChatFilterMembersUseCase {
  constructor(
    private readonly userGroupRepository: IUserGroupRepository,
    private readonly groupChatRepository: IGroupChatRepository,
  ) {}

  async execute(
    userId: number,
    groupId: number,
    id: number,
    filterMemberUserIds: number[],
  ): Promise<GroupChatEntity> {
    UserGroupValidationUtils.assertValidUserId(userId);
    UserGroupValidationUtils.assertValidGroupId(groupId);
    GroupChatValidationUtils.assertValidId(id);
    GroupChatValidationUtils.assertValidFilterMemberUserIds(filterMemberUserIds);

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

    const groupMemberUserIds =
      await this.userGroupRepository.findMemberUserIds(groupId);
    const groupMemberUserIdSet = new Set(groupMemberUserIds);

    const invalidUserIds: number[] = [];

    for (const memberUserId of filterMemberUserIds) {
      const isGroupMember = groupMemberUserIdSet.has(memberUserId);

      if (!isGroupMember) {
        invalidUserIds.push(memberUserId);
      }
    }

    const hasInvalidUserIds = invalidUserIds.length > 0;

    if (hasInvalidUserIds) {
      throw new GroupChatInvalidFilterMemberUserIdsException(invalidUserIds);
    }

    const updatedChat = await this.groupChatRepository.updateFilterMembers(
      groupId,
      id,
      filterMemberUserIds,
    );

    if (!updatedChat) {
      Logger.debug("Group chat not found for filter members update", {
        groupId,
        userId,
        groupChatId: id,
      });
      throw new GroupChatNotFoundException(id);
    }

    const filterMemberCount = filterMemberUserIds.length;

    Logger.info("Group chat filter members updated", {
      groupId,
      userId,
      groupChatId: id,
      filterMemberCount,
    });

    return updatedChat;
  }
}
