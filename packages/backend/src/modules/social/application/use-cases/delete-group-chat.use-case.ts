import type { IChatThreadRepository } from "@/domains/movies/domain/repositories/chat-thread.repository";
import { Logger } from "@/lib/logger/logger";
import { GroupChatDeleteAfterPurgeFailedException } from "../../domain/exceptions/group-chat-delete-after-purge-failed.exception";
import { GroupChatNotFoundException } from "../../domain/exceptions/group-chat-not-found.exception";
import { NotGroupMemberException } from "../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../domain/exceptions/user-group-not-found.exception";
import { GroupChatValidationUtils } from "../../domain/group-chat-validation.utils";
import type { IGroupChatRepository } from "../../domain/repositories/group-chat.repository";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export class DeleteGroupChatUseCase {
  constructor(
    private readonly userGroupRepository: IUserGroupRepository,
    private readonly groupChatRepository: IGroupChatRepository,
    private readonly chatThreadRepository: IChatThreadRepository,
  ) {}

  async execute(userId: number, groupId: number, id: number): Promise<void> {
    UserGroupValidationUtils.assertValidUserId(userId);
    UserGroupValidationUtils.assertValidGroupId(groupId);
    GroupChatValidationUtils.assertValidId(id);

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

    const chat = await this.groupChatRepository.findById(groupId, id);

    if (!chat) {
      Logger.debug("Group chat not found for delete", {
        groupId,
        userId,
        groupChatId: id,
      });
      throw new GroupChatNotFoundException(id);
    }

    const chatId = chat.chatId;
    // Purge primeiro: metadados não devem sumir se o checkpointer falhar.
    await this.chatThreadRepository.deleteThread(chatId);

    let deleted = await this.groupChatRepository.deleteById(groupId, id);

    if (!deleted) {
      Logger.warn("Group chat metadata delete failed after purge, retrying once", {
        groupId,
        userId,
        groupChatId: id,
        chatId,
      });
      deleted = await this.groupChatRepository.deleteById(groupId, id);
    }

    if (!deleted) {
      Logger.error("Group chat metadata delete failed after thread purge", {
        groupId,
        userId,
        groupChatId: id,
        chatId,
      });
      throw new GroupChatDeleteAfterPurgeFailedException(id, chatId);
    }

    Logger.info("Group chat deleted", {
      groupId,
      userId,
      groupChatId: id,
      chatId,
    });
  }
}
