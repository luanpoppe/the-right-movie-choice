import { Logger } from "@/lib/logger/logger";
import type { GroupChatEntity } from "../../domain/entities/group-chat.entity";
import { GroupChatNotFoundException } from "../../domain/exceptions/group-chat-not-found.exception";
import { NotGroupMemberException } from "../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../domain/exceptions/user-group-not-found.exception";
import { GroupChatValidationUtils } from "../../domain/group-chat-validation.utils";
import type { IGroupChatRepository } from "../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export class UpdateGroupChatTitleUseCase {
  constructor(
    private readonly userGroupRepository: IUserGroupRepository,
    private readonly groupChatRepository: IGroupChatRepository,
  ) {}

  async execute(
    userId: number,
    groupId: number,
    id: number,
    title: string,
  ): Promise<GroupChatEntity> {
    UserGroupValidationUtils.assertValidUserId(userId);
    UserGroupValidationUtils.assertValidGroupId(groupId);
    GroupChatValidationUtils.assertValidId(id);
    GroupChatValidationUtils.assertValidTitle(title);

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

    const updatedChat = await this.groupChatRepository.updateTitle(
      groupId,
      id,
      title,
    );

    if (!updatedChat) {
      Logger.debug("Group chat not found for title update", {
        groupId,
        userId,
        groupChatId: id,
      });
      throw new GroupChatNotFoundException(id);
    }

    Logger.info("Group chat title updated", {
      groupId,
      userId,
      groupChatId: id,
    });

    return updatedChat;
  }
}
