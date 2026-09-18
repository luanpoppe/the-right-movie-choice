import { randomUUID } from "node:crypto";
import { Logger } from "@/lib/logger/logger";
import type { GroupChatEntity } from "../../domain/entities/group-chat.entity";
import { GroupChatValidationUtils } from "../../domain/group-chat-validation.utils";
import { NotGroupMemberException } from "../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../domain/exceptions/user-group-not-found.exception";
import type { IGroupChatRepository } from "../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export class CreateGroupChatUseCase {
  constructor(
    private readonly userGroupRepository: IUserGroupRepository,
    private readonly groupChatRepository: IGroupChatRepository,
  ) {}

  async execute(
    userId: number,
    groupId: number,
    title?: string | null,
  ): Promise<GroupChatEntity> {
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

    const hasTitle = title != null;

    if (hasTitle) {
      GroupChatValidationUtils.assertValidTitle(title);
    }

    const chatId = randomUUID();
    const filterMemberUserIds =
      await this.userGroupRepository.findMemberUserIds(groupId);

    const createdChat = await this.groupChatRepository.create({
      groupId,
      chatId,
      title: title ?? null,
      filterMemberUserIds,
    });

    Logger.info("Group chat created", {
      groupId,
      userId,
      chatId,
      groupChatId: createdChat.id,
    });

    return createdChat;
  }
}
