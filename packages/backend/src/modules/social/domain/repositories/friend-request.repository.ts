import type {
  FriendRequestEntity,
  IncomingFriendRequestEntity,
  OutgoingFriendRequestEntity,
  UserPublicEntity,
} from "../entities/friend-request.entity";
import type {
  FriendRequestStatus,
  RelationshipStatus,
} from "../types/relationship-status.type";

export interface IFriendRequestRepository {
  findById(id: number): Promise<FriendRequestEntity | null>;

  findLatestBetweenUsers(
    firstUserId: number,
    secondUserId: number,
  ): Promise<FriendRequestEntity | null>;

  createPending(
    requesterId: number,
    addresseeId: number,
  ): Promise<FriendRequestEntity>;

  updateStatus(
    id: number,
    status: FriendRequestStatus,
  ): Promise<FriendRequestEntity>;

  deleteById(id: number): Promise<void>;

  listAcceptedFriends(userId: number): Promise<UserPublicEntity[]>;

  listIncomingPending(userId: number): Promise<IncomingFriendRequestEntity[]>;

  listOutgoingPending(userId: number): Promise<OutgoingFriendRequestEntity[]>;

  resolveRelationshipStatus(
    viewerUserId: number,
    otherUserId: number,
  ): Promise<RelationshipStatus>;
}
