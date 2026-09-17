import { movieClient } from "@/lib/api/movie-client";
import {
  UserConversationCreateResponseDTO,
  UserConversationCreateResponseDTOSchema,
  UserConversationGetResponseDTO,
  UserConversationGetResponseDTOSchema,
  UserConversationListResponseDTO,
  UserConversationListResponseDTOSchema,
  UserConversationPatchResponseDTO,
  UserConversationPatchResponseDTOSchema,
} from "../dto/user-conversation.dto";

export class UserConversationService {
  static async create(): Promise<UserConversationCreateResponseDTO> {
    const { data } = await movieClient.post("/movie/conversations");
    const parsedResponse = UserConversationCreateResponseDTOSchema.parse(data);

    return parsedResponse;
  }

  static async listConversations(): Promise<UserConversationListResponseDTO> {
    const { data } = await movieClient.get("/movie/conversations");
    const parsedResponse = UserConversationListResponseDTOSchema.parse(data);

    return parsedResponse;
  }

  static async getById(id: number): Promise<UserConversationGetResponseDTO> {
    const url = `/movie/conversations/${id}`;
    const { data } = await movieClient.get(url);
    const parsedResponse = UserConversationGetResponseDTOSchema.parse(data);

    return parsedResponse;
  }

  static async updateTitle(
    id: number,
    title: string,
  ): Promise<UserConversationPatchResponseDTO> {
    const url = `/movie/conversations/${id}`;
    const patchBody = { title };
    const { data } = await movieClient.patch(url, patchBody);

    const parsedResponse = UserConversationPatchResponseDTOSchema.parse(data);
    return parsedResponse;
  }

  static async delete(id: number): Promise<void> {
    const url = `/movie/conversations/${id}`;
    await movieClient.delete(url);
  }
}
