import type { UserPublicEntity } from "./friend-request.entity";
import type { GroupInviteStatus } from "../types/group-invite-status.type";

export type GroupInviteEntity = {
  id: number;
  groupId: number;
  inviterId: number;
  inviteeId: number;
  status: GroupInviteStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type IncomingGroupInviteEntity = {
  id: number;
  group: {
    id: number;
    name: string;
  };
  inviter: UserPublicEntity;
  status: GroupInviteStatus;
  createdAt: Date;
};
