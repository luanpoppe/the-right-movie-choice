import type { GetUserConversationResult } from "@/domains/movies/application/use-cases/get-user-conversation.use-case";
import type { UserConversationEntity } from "@/domains/movies/domain/entities/user-conversation.entity";
import type {
  UserConversationCreateResponseDTO,
  UserConversationGetResponseDTO,
  UserConversationListResponseDTO,
  UserConversationPatchResponseDTO,
  UserConversationSummaryResponse,
} from "../dto/user-conversation.dto";

export class UserConversationResponseMapper {
  static toConversationResponse(
    entity: UserConversationEntity,
  ): UserConversationSummaryResponse {
    const createdAt = entity.createdAt.toISOString();
    const updatedAt = entity.updatedAt.toISOString();

    const response: UserConversationSummaryResponse = {
      id: entity.id,
      chatId: entity.chatId,
      title: entity.title,
      createdAt,
      updatedAt,
    };

    return response;
  }

  static toCreateResponse(
    entity: UserConversationEntity,
  ): UserConversationCreateResponseDTO {
    const response =
      UserConversationResponseMapper.toConversationResponse(entity);
    return response;
  }

  static toListResponse(
    entities: UserConversationEntity[],
  ): UserConversationListResponseDTO {
    const conversations = entities.map((entity) => {
      const summary =
        UserConversationResponseMapper.toConversationResponse(entity);
      return summary;
    });
    return conversations;
  }

  static toGetResponse(
    result: GetUserConversationResult,
  ): UserConversationGetResponseDTO {
    const conversation = result.conversation;
    const messages = result.messages;
    const summary =
      UserConversationResponseMapper.toConversationResponse(conversation);

    const response: UserConversationGetResponseDTO = {
      id: summary.id,
      chatId: summary.chatId,
      title: summary.title,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
      messages,
    };

    return response;
  }

  static toPatchResponse(
    entity: UserConversationEntity,
  ): UserConversationPatchResponseDTO {
    const response =
      UserConversationResponseMapper.toConversationResponse(entity);
    return response;
  }
}
