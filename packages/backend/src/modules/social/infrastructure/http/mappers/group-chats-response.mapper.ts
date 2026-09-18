import type { GetGroupChatResult } from "@/modules/social/application/use-cases/get-group-chat.use-case";
import type { GroupChatEntity } from "@/modules/social/domain/entities/group-chat.entity";
import type {
  GroupChatCreateResponse,
  GroupChatGetResponse,
  GroupChatListResponse,
  GroupChatSummaryResponse,
  GroupChatUpdateFilterMembersResponse,
  GroupChatUpdateTitleResponse,
} from "../dto/group-chats.dto";

export class GroupChatsResponseMapper {
  static toGroupChatSummaryResponse(
    entity: GroupChatEntity,
  ): GroupChatSummaryResponse {
    const createdAt = entity.createdAt.toISOString();
    const updatedAt = entity.updatedAt.toISOString();

    const response: GroupChatSummaryResponse = {
      id: entity.id,
      groupId: entity.groupId,
      chatId: entity.chatId,
      title: entity.title,
      filterMemberUserIds: entity.filterMemberUserIds,
      createdAt,
      updatedAt,
    };

    return response;
  }

  static toCreateResponse(entity: GroupChatEntity): GroupChatCreateResponse {
    const response =
      GroupChatsResponseMapper.toGroupChatSummaryResponse(entity);
    return response;
  }

  static toListResponse(entities: GroupChatEntity[]): GroupChatListResponse {
    const chats = entities.map((entity) => {
      const summary =
        GroupChatsResponseMapper.toGroupChatSummaryResponse(entity);
      return summary;
    });

    return chats;
  }

  static toGetResponse(result: GetGroupChatResult): GroupChatGetResponse {
    const chat = result.chat;
    const messages = result.messages;
    const summary = GroupChatsResponseMapper.toGroupChatSummaryResponse(chat);

    const response: GroupChatGetResponse = {
      id: summary.id,
      groupId: summary.groupId,
      chatId: summary.chatId,
      title: summary.title,
      filterMemberUserIds: summary.filterMemberUserIds,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
      messages,
    };

    return response;
  }

  static toUpdateTitleResponse(
    entity: GroupChatEntity,
  ): GroupChatUpdateTitleResponse {
    const response =
      GroupChatsResponseMapper.toGroupChatSummaryResponse(entity);
    return response;
  }

  static toUpdateFilterMembersResponse(
    entity: GroupChatEntity,
  ): GroupChatUpdateFilterMembersResponse {
    const response =
      GroupChatsResponseMapper.toGroupChatSummaryResponse(entity);
    return response;
  }
}
