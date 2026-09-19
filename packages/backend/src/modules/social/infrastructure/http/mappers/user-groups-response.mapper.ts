import type { UserPublicEntity } from "@/modules/social/domain/entities/friend-request.entity";
import type {
  GroupInviteEntity,
  IncomingGroupInviteEntity,
} from "@/modules/social/domain/entities/group-invite.entity";
import type {
  UserGroupEntity,
  UserGroupListItemEntity,
} from "@/modules/social/domain/entities/user-group.entity";
import type {
  GroupFriendSuggestionResponse,
  GroupInviteResponse,
  IncomingGroupInviteResponse,
  ListGroupFriendSuggestionsResponse,
  ListGroupMembersResponse,
  ListIncomingGroupInvitesResponse,
  ListUserGroupsResponse,
  UserGroupListItemResponse,
  UserGroupResponse,
} from "../dto/user-groups.dto";

export class UserGroupsResponseMapper {
  static toUserGroupResponse(entity: UserGroupEntity): UserGroupResponse {
    const createdAt = entity.createdAt.toISOString();
    const updatedAt = entity.updatedAt.toISOString();

    const response: UserGroupResponse = {
      id: entity.id,
      name: entity.name,
      ownerId: entity.ownerId,
      createdAt,
      updatedAt,
    };

    if (entity.description !== undefined) {
      response.description = entity.description;
    }

    return response;
  }

  static toUserGroupListItemResponse(
    entity: UserGroupListItemEntity,
  ): UserGroupListItemResponse {
    const joinedAt = entity.joinedAt.toISOString();

    const response: UserGroupListItemResponse = {
      id: entity.id,
      name: entity.name,
      ownerId: entity.ownerId,
      memberCount: entity.memberCount,
      joinedAt,
    };

    if (entity.description !== undefined) {
      response.description = entity.description;
    }

    return response;
  }

  static toListUserGroupsResponse(
    entities: UserGroupListItemEntity[],
  ): ListUserGroupsResponse {
    const groups = entities.map((entity) => {
      const item = UserGroupsResponseMapper.toUserGroupListItemResponse(entity);
      return item;
    });

    return groups;
  }

  static toGroupInviteResponse(entity: GroupInviteEntity): GroupInviteResponse {
    const createdAt = entity.createdAt.toISOString();
    const updatedAt = entity.updatedAt.toISOString();

    const response: GroupInviteResponse = {
      id: entity.id,
      groupId: entity.groupId,
      inviterId: entity.inviterId,
      inviteeId: entity.inviteeId,
      status: entity.status,
      createdAt,
      updatedAt,
    };

    return response;
  }

  static toGroupFriendSuggestionResponse(
    entity: UserPublicEntity,
  ): GroupFriendSuggestionResponse {
    const response: GroupFriendSuggestionResponse = {
      id: entity.id,
      name: entity.name,
      email: entity.email,
    };

    return response;
  }

  static toListGroupFriendSuggestionsResponse(
    entities: UserPublicEntity[],
  ): ListGroupFriendSuggestionsResponse {
    const suggestions = entities.map((entity) => {
      const item =
        UserGroupsResponseMapper.toGroupFriendSuggestionResponse(entity);
      return item;
    });

    return suggestions;
  }

  static toListGroupMembersResponse(
    entities: UserPublicEntity[],
  ): ListGroupMembersResponse {
    const members = entities.map((entity) => {
      const item =
        UserGroupsResponseMapper.toGroupFriendSuggestionResponse(entity);
      return item;
    });

    return members;
  }

  static toIncomingGroupInviteResponse(
    entity: IncomingGroupInviteEntity,
  ): IncomingGroupInviteResponse {
    const createdAt = entity.createdAt.toISOString();

    const response: IncomingGroupInviteResponse = {
      id: entity.id,
      group: {
        id: entity.group.id,
        name: entity.group.name,
      },
      inviter: {
        id: entity.inviter.id,
        name: entity.inviter.name,
        email: entity.inviter.email,
      },
      status: entity.status,
      createdAt,
    };

    return response;
  }

  static toListIncomingGroupInvitesResponse(
    entities: IncomingGroupInviteEntity[],
  ): ListIncomingGroupInvitesResponse {
    const invites = entities.map((entity) => {
      const item =
        UserGroupsResponseMapper.toIncomingGroupInviteResponse(entity);
      return item;
    });

    return invites;
  }
}
