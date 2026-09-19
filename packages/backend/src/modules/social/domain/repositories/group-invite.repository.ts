import type {
  GroupInviteEntity,
  IncomingGroupInviteEntity,
} from "../entities/group-invite.entity";
import type { GroupInviteStatus } from "../types/group-invite-status.type";

export interface IGroupInviteRepository {
  findById(id: number): Promise<GroupInviteEntity | null>;

  findLatestPending(
    groupId: number,
    inviteeId: number,
  ): Promise<GroupInviteEntity | null>;

  createPending(
    groupId: number,
    inviterId: number,
    inviteeId: number,
  ): Promise<GroupInviteEntity>;

  updateStatus(
    id: number,
    status: GroupInviteStatus,
  ): Promise<GroupInviteEntity>;

  deleteById(id: number): Promise<void>;

  listIncomingPending(inviteeId: number): Promise<IncomingGroupInviteEntity[]>;

  hasPendingInvite(groupId: number, inviteeId: number): Promise<boolean>;

  acceptPendingAndAddMember(
    inviteId: number,
    groupId: number,
    inviteeId: number,
  ): Promise<GroupInviteEntity>;

  createPendingIfAvailable(
    groupId: number,
    inviterId: number,
    inviteeId: number,
  ): Promise<GroupInviteEntity>;

  findPendingInviteeUserIds(groupId: number): Promise<number[]>;
}
