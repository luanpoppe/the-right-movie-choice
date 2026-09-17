import type { FriendRequestStatus } from "../types/relationship-status.type";

export type UserPublicEntity = {
  id: number;
  name: string;
  email: string;
};

export type FriendRequestEntity = {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type IncomingFriendRequestEntity = {
  id: number;
  requester: UserPublicEntity;
  status: FriendRequestStatus;
  createdAt: Date;
};

export type OutgoingFriendRequestEntity = {
  id: number;
  addressee: UserPublicEntity;
  status: FriendRequestStatus;
  createdAt: Date;
};
