import { movieClient } from "@/lib/api/movie-client";
import {
  FriendRequestResponse,
  FriendRequestResponseSchema,
  ListFriendsResponse,
  ListFriendsResponseSchema,
  ListIncomingFriendRequestsResponse,
  ListIncomingFriendRequestsResponseSchema,
  ListOutgoingFriendRequestsResponse,
  ListOutgoingFriendRequestsResponseSchema,
  SearchUserByEmailResponse,
  SearchUserByEmailResponseSchema,
} from "../dto/friendship.dto";

export class FriendshipService {
  static async listFriends(): Promise<ListFriendsResponse> {
    const url = "/social/friends";
    const { data } = await movieClient.get(url);
    const parsedResponse = ListFriendsResponseSchema.parse(data);

    return parsedResponse;
  }

  static async sendFriendRequest(email: string): Promise<FriendRequestResponse> {
    const url = "/social/friend-requests";
    const requestBody = { email };
    const { data } = await movieClient.post(url, requestBody);
    const parsedResponse = FriendRequestResponseSchema.parse(data);

    return parsedResponse;
  }

  static async acceptFriendRequest(
    id: number,
  ): Promise<FriendRequestResponse> {
    const url = `/social/friend-requests/${id}/accept`;
    const { data } = await movieClient.post(url);
    const parsedResponse = FriendRequestResponseSchema.parse(data);

    return parsedResponse;
  }

  static async rejectFriendRequest(
    id: number,
  ): Promise<FriendRequestResponse> {
    const url = `/social/friend-requests/${id}/reject`;
    const { data } = await movieClient.post(url);
    const parsedResponse = FriendRequestResponseSchema.parse(data);

    return parsedResponse;
  }

  static async cancelFriendRequest(id: number): Promise<void> {
    const url = `/social/friend-requests/${id}`;
    await movieClient.delete(url);
  }

  static async removeFriend(userId: number): Promise<void> {
    const url = `/social/friends/${userId}`;
    await movieClient.delete(url);
  }

  static async listIncomingFriendRequests(): Promise<ListIncomingFriendRequestsResponse> {
    const url = "/social/friend-requests/incoming";
    const { data } = await movieClient.get(url);
    const parsedResponse =
      ListIncomingFriendRequestsResponseSchema.parse(data);

    return parsedResponse;
  }

  static async listOutgoingFriendRequests(): Promise<ListOutgoingFriendRequestsResponse> {
    const url = "/social/friend-requests/outgoing";
    const { data } = await movieClient.get(url);
    const parsedResponse =
      ListOutgoingFriendRequestsResponseSchema.parse(data);

    return parsedResponse;
  }

  static async searchUserByEmail(
    email: string,
  ): Promise<SearchUserByEmailResponse> {
    const queryParams = new URLSearchParams({ email });
    const queryString = queryParams.toString();
    const url = `/social/users/search?${queryString}`;
    const { data } = await movieClient.get(url);
    const parsedResponse = SearchUserByEmailResponseSchema.parse(data);

    return parsedResponse;
  }
}
