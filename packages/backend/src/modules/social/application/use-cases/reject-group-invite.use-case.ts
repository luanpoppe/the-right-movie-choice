import { Logger } from "@/lib/logger/logger";
import type { GroupInviteEntity } from "../../domain/entities/group-invite.entity";
import { GroupInviteNotFoundException } from "../../domain/exceptions/group-invite-not-found.exception";
import type { IGroupInviteRepository } from "../../domain/repositories/group-invite.repository";

export class RejectGroupInviteUseCase {
  constructor(
    private readonly groupInviteRepository: IGroupInviteRepository,
  ) {}

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
    const canReject = isInvitee && isPending;

    if (!canReject) {
      throw new GroupInviteNotFoundException(groupInviteId);
    }

    const rejectedInvite = await this.groupInviteRepository.updateStatus(
      groupInviteId,
      "rejected",
    );

    Logger.info("Group invite rejected", {
      groupInviteId,
      inviteeId,
      inviterId: rejectedInvite.inviterId,
      groupId: rejectedInvite.groupId,
    });

    return rejectedInvite;
  }
}
