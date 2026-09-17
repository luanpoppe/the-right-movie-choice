import type { SearchUserByEmailResult } from "@/modules/social/application/use-cases/search-user-by-email.use-case";
import type {
  FriendRequestEntity,
  IncomingFriendRequestEntity,
  OutgoingFriendRequestEntity,
  UserPublicEntity,
} from "@/modules/social/domain/entities/friend-request.entity";
import type {
  FriendRequestResponse,
  IncomingFriendRequestResponse,
  ListFriendsResponse,
  ListIncomingFriendRequestsResponse,
  ListOutgoingFriendRequestsResponse,
  OutgoingFriendRequestResponse,
  SearchUserByEmailResponse,
  UserPublicResponse,
} from "../dto/friendship.dto";

export class FriendshipResponseMapper {
  static toUserPublicResponse(entity: UserPublicEntity): UserPublicResponse {
    const response: UserPublicResponse = {
      id: entity.id,
      name: entity.name,
      email: entity.email,
    };

    return response;
  }

  static toFriendRequestResponse(
    entity: FriendRequestEntity,
  ): FriendRequestResponse {
    const createdAt = entity.createdAt.toISOString();
    const updatedAt = entity.updatedAt.toISOString();

    const response: FriendRequestResponse = {
      id: entity.id,
      requesterId: entity.requesterId,
      addresseeId: entity.addresseeId,
      status: entity.status,
      createdAt,
      updatedAt,
    };

    return response;
  }

  static toListFriendsResponse(
    friends: UserPublicEntity[],
  ): ListFriendsResponse {
    const mappedFriends = friends.map((friend) => {
      const userPublic = FriendshipResponseMapper.toUserPublicResponse(friend);
      return userPublic;
    });

    const response: ListFriendsResponse = {
      friends: mappedFriends,
    };

    return response;
  }

  static toIncomingFriendRequestResponse(
    entity: IncomingFriendRequestEntity,
  ): IncomingFriendRequestResponse {
    const createdAt = entity.createdAt.toISOString();
    const requester = FriendshipResponseMapper.toUserPublicResponse(
      entity.requester,
    );

    const response: IncomingFriendRequestResponse = {
      id: entity.id,
      requester,
      status: entity.status,
      createdAt,
    };

    return response;
  }

  static toListIncomingFriendRequestsResponse(
    entities: IncomingFriendRequestEntity[],
  ): ListIncomingFriendRequestsResponse {
    const requests = entities.map((entity) => {
      const item =
        FriendshipResponseMapper.toIncomingFriendRequestResponse(entity);
      return item;
    });

    return requests;
  }

  static toOutgoingFriendRequestResponse(
    entity: OutgoingFriendRequestEntity,
  ): OutgoingFriendRequestResponse {
    const createdAt = entity.createdAt.toISOString();
    const addressee = FriendshipResponseMapper.toUserPublicResponse(
      entity.addressee,
    );

    const response: OutgoingFriendRequestResponse = {
      id: entity.id,
      addressee,
      status: entity.status,
      createdAt,
    };

    return response;
  }

  static toListOutgoingFriendRequestsResponse(
    entities: OutgoingFriendRequestEntity[],
  ): ListOutgoingFriendRequestsResponse {
    const requests = entities.map((entity) => {
      const item =
        FriendshipResponseMapper.toOutgoingFriendRequestResponse(entity);
      return item;
    });

    return requests;
  }

  static toSearchUserByEmailResponse(
    result: SearchUserByEmailResult,
  ): SearchUserByEmailResponse {
    const response: SearchUserByEmailResponse = {
      id: result.id,
      name: result.name,
      email: result.email,
      relationshipStatus: result.relationshipStatus,
    };

    return response;
  }
}
