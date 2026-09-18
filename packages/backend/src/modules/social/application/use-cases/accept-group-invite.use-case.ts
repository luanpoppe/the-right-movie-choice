import { Logger } from "@/lib/logger/logger";
import type { GroupInviteEntity } from "../../domain/entities/group-invite.entity";
import { GroupInviteNotFoundException } from "../../domain/exceptions/group-invite-not-found.exception";
import type { IGroupInviteRepository } from "../../domain/repositories/group-invite.repository";

export class AcceptGroupInviteUseCase {
  constructor(private readonly groupInviteRepository: IGroupInviteRepository) {}

  async execute(
    inviteeId: number,
    groupInviteId: number,
  ): Promise<GroupInviteEntity> {
    const groupInvite =
      await this.groupInviteRepository.findById(groupInviteId);

    if (!groupInvite) {
      throw new GroupInviteNotFoundException(groupInviteId);
    }

    const isInvitee = groupInvite.inviteeId === inviteeId;
    const isPending = groupInvite.status === "pending";
    const canAccept = isInvitee && isPending;

    if (!canAccept) {
      throw new GroupInviteNotFoundException(groupInviteId);
    }

    const groupId = groupInvite.groupId;
    const acceptedInvite =
      await this.groupInviteRepository.acceptPendingAndAddMember(
        groupInviteId,
        groupId,
        inviteeId,
      );

    Logger.info("Group invite accepted", {
      groupInviteId,
      groupId,
      inviteeId,
      inviterId: acceptedInvite.inviterId,
    });

    return acceptedInvite;
  }
}
