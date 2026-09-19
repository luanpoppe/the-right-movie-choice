import { movieClient } from "@/lib/api/movie-client";
import {
  GroupChatCreateResponse,
  GroupChatCreateResponseSchema,
  GroupChatGetResponse,
  GroupChatGetResponseSchema,
  GroupChatListResponse,
  GroupChatListResponseSchema,
  GroupChatRecommendationResponse,
  GroupChatRecommendationResponseSchema,
  GroupChatUpdateFilterMembersResponse,
  GroupChatUpdateFilterMembersResponseSchema,
  GroupChatUpdateTitleResponse,
  GroupChatUpdateTitleResponseSchema,
} from "../dto/group-chats.dto";

export class GroupChatsService {
  static async create(groupId: number): Promise<GroupChatCreateResponse> {
    const url = `/social/groups/${groupId}/chats`;
    const createBody = {};
    const { data } = await movieClient.post(url, createBody);
    const parsedResponse = GroupChatCreateResponseSchema.parse(data);

    return parsedResponse;
  }

  static async list(groupId: number): Promise<GroupChatListResponse> {
    const url = `/social/groups/${groupId}/chats`;
    const { data } = await movieClient.get(url);
    const parsedResponse = GroupChatListResponseSchema.parse(data);

    return parsedResponse;
  }

  static async getByChatId(
    groupId: number,
    chatId: string,
  ): Promise<GroupChatGetResponse> {
    const url = `/social/groups/${groupId}/chats/${chatId}`;
    const { data } = await movieClient.get(url);
    const parsedResponse = GroupChatGetResponseSchema.parse(data);

    return parsedResponse;
  }

  static async updateTitle(
    groupId: number,
    id: number,
    title: string,
  ): Promise<GroupChatUpdateTitleResponse> {
    const url = `/social/groups/${groupId}/chats/${id}`;
    const patchBody = { title };
    const { data } = await movieClient.patch(url, patchBody);
    const parsedResponse = GroupChatUpdateTitleResponseSchema.parse(data);

    return parsedResponse;
  }

  static async delete(groupId: number, id: number): Promise<void> {
    const url = `/social/groups/${groupId}/chats/${id}`;
    await movieClient.delete(url);
  }

  static async updateFilterMembers(
    groupId: number,
    id: number,
    userIds: number[],
  ): Promise<GroupChatUpdateFilterMembersResponse> {
    const url = `/social/groups/${groupId}/chats/${id}/filter-members`;
    const patchBody = { userIds };
    const { data } = await movieClient.patch(url, patchBody);
    const parsedResponse =
      GroupChatUpdateFilterMembersResponseSchema.parse(data);

    return parsedResponse;
  }

  static async recommend(
    groupId: number,
    chatId: string,
    query: string,
  ): Promise<GroupChatRecommendationResponse> {
    const url = `/social/groups/${groupId}/chats/${chatId}/recommendation`;
    const requestBody = { query };
    const { data } = await movieClient.post(url, requestBody);
    const parsedResponse = GroupChatRecommendationResponseSchema.parse(data);

    return parsedResponse;
  }
}
