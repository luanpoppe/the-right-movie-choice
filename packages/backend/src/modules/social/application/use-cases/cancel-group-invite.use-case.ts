import { Logger } from "@/lib/logger/logger";
import { GroupInviteNotFoundException } from "../../domain/exceptions/group-invite-not-found.exception";
import type { IGroupInviteRepository } from "../../domain/repositories/group-invite.repository";

export class CancelGroupInviteUseCase {
  constructor(
    private readonly groupInviteRepository: IGroupInviteRepository,
  ) {}

  async execute(inviterId: number, groupInviteId: number): Promise<void> {
    const groupInvite =
      await this.groupInviteRepository.findById(groupInviteId);

    if (!groupInvite) {
      throw new GroupInviteNotFoundException(groupInviteId);
    }

    const isInviter = groupInvite.inviterId === inviterId;
    const isPending = groupInvite.status === "pending";
    const canCancel = isInviter && isPending;

    if (!canCancel) {
      throw new GroupInviteNotFoundException(groupInviteId);
    }

    await this.groupInviteRepository.deleteById(groupInviteId);

    Logger.info("Group invite cancelled", {
      groupInviteId,
      inviterId,
      inviteeId: groupInvite.inviteeId,
      groupId: groupInvite.groupId,
    });
  }
}
