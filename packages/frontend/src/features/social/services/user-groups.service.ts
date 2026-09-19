import { movieClient } from "@/lib/api/movie-client";
import {
  CreateUserGroupDTO,
  GroupInviteResponse,
  GroupInviteResponseSchema,
  ListGroupFriendSuggestionsResponse,
  ListGroupFriendSuggestionsResponseSchema,
  ListGroupMembersResponse,
  ListGroupMembersResponseSchema,
  ListIncomingGroupInvitesResponse,
  ListIncomingGroupInvitesResponseSchema,
  ListUserGroupsResponse,
  ListUserGroupsResponseSchema,
  SendGroupInviteDTO,
  UpdateUserGroupDTO,
  UserGroupResponse,
  UserGroupResponseSchema,
} from "../dto/user-groups.dto";

export class UserGroupsService {
  static async create(dto: CreateUserGroupDTO): Promise<UserGroupResponse> {
    const { data } = await movieClient.post("/social/groups", dto);
    const parsedResponse = UserGroupResponseSchema.parse(data);

    return parsedResponse;
  }

  static async listGroups(): Promise<ListUserGroupsResponse> {
    const { data } = await movieClient.get("/social/groups");
    const parsedResponse = ListUserGroupsResponseSchema.parse(data);

    return parsedResponse;
  }

  static async update(
    id: number,
    dto: UpdateUserGroupDTO,
  ): Promise<UserGroupResponse> {
    const url = `/social/groups/${id}`;
    const { data } = await movieClient.patch(url, dto);
    const parsedResponse = UserGroupResponseSchema.parse(data);

    return parsedResponse;
  }

  static async delete(id: number): Promise<void> {
    const url = `/social/groups/${id}`;
    await movieClient.delete(url);
  }

  static async sendInvite(
    groupId: number,
    dto: SendGroupInviteDTO,
  ): Promise<GroupInviteResponse> {
    const url = `/social/groups/${groupId}/invites`;
    const { data } = await movieClient.post(url, dto);
    const parsedResponse = GroupInviteResponseSchema.parse(data);

    return parsedResponse;
  }

  static async leaveGroup(groupId: number): Promise<void> {
    const url = `/social/groups/${groupId}/members/me`;
    await movieClient.delete(url);
  }

  static async removeMember(groupId: number, userId: number): Promise<void> {
    const url = `/social/groups/${groupId}/members/${userId}`;
    await movieClient.delete(url);
  }

  static async listSuggestions(
    groupId: number,
  ): Promise<ListGroupFriendSuggestionsResponse> {
    const url = `/social/groups/${groupId}/suggestions`;
    const { data } = await movieClient.get(url);
    const parsedResponse = ListGroupFriendSuggestionsResponseSchema.parse(data);

    return parsedResponse;
  }

  static async listMembers(
    groupId: number,
  ): Promise<ListGroupMembersResponse> {
    const url = `/social/groups/${groupId}/members`;
    const { data } = await movieClient.get(url);
    const parsedResponse = ListGroupMembersResponseSchema.parse(data);

    return parsedResponse;
  }

  static async listIncomingInvites(): Promise<ListIncomingGroupInvitesResponse> {
    const { data } = await movieClient.get("/social/group-invites/incoming");
    const parsedResponse = ListIncomingGroupInvitesResponseSchema.parse(data);

    return parsedResponse;
  }

  static async acceptInvite(inviteId: number): Promise<GroupInviteResponse> {
    const url = `/social/group-invites/${inviteId}/accept`;
    const { data } = await movieClient.post(url);
    const parsedResponse = GroupInviteResponseSchema.parse(data);

    return parsedResponse;
  }

  static async rejectInvite(inviteId: number): Promise<GroupInviteResponse> {
    const url = `/social/group-invites/${inviteId}/reject`;
    const { data } = await movieClient.post(url);
    const parsedResponse = GroupInviteResponseSchema.parse(data);

    return parsedResponse;
  }

  static async cancelInvite(inviteId: number): Promise<void> {
    const url = `/social/group-invites/${inviteId}`;
    await movieClient.delete(url);
  }
}
