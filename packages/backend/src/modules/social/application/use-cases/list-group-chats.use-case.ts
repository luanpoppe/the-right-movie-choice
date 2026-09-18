import { Logger } from "@/lib/logger/logger";
import type { GroupChatEntity } from "../../domain/entities/group-chat.entity";
import { NotGroupMemberException } from "../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../domain/exceptions/user-group-not-found.exception";
import type { IGroupChatRepository } from "../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export class ListGroupChatsUseCase {
  constructor(
    private readonly userGroupRepository: IUserGroupRepository,
    private readonly groupChatRepository: IGroupChatRepository,
  ) {}

  async execute(userId: number, groupId: number): Promise<GroupChatEntity[]> {
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

    const chats = await this.groupChatRepository.listByGroupId(groupId);

    Logger.info("Group chats listed", {
      groupId,
      userId,
      count: chats.length,
    });

    return chats;
  }
}
