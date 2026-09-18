import { Logger } from "@/lib/logger/logger";
import type { IncomingGroupInviteEntity } from "../../domain/entities/group-invite.entity";
import type { IGroupInviteRepository } from "../../domain/repositories/group-invite.repository";

export class ListIncomingGroupInvitesUseCase {
  constructor(
    private readonly groupInviteRepository: IGroupInviteRepository,
  ) {}

  async execute(inviteeId: number): Promise<IncomingGroupInviteEntity[]> {
    const incomingInvites =
      await this.groupInviteRepository.listIncomingPending(inviteeId);

    Logger.info("Incoming group invites listed", {
      inviteeId,
      count: incomingInvites.length,
    });

    return incomingInvites;
  }
}
