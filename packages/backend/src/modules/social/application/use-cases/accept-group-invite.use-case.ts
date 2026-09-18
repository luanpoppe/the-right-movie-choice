import { Logger } from "@/lib/logger/logger";
import type { GroupInviteEntity } from "../../domain/entities/group-invite.entity";
import { GroupFullException } from "../../domain/exceptions/group-full.exception";
import { GroupInviteNotFoundException } from "../../domain/exceptions/group-invite-not-found.exception";
import type { IGroupInviteRepository } from "../../domain/repositories/group-invite.repository";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { MAX_GROUP_MEMBERS } from "../../domain/utils/user-group-validation.utils";

export class AcceptGroupInviteUseCase {
  constructor(
    private readonly groupInviteRepository: IGroupInviteRepository,
    private readonly userGroupRepository: IUserGroupRepository,
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
    const canAccept = isInvitee && isPending;

    if (!canAccept) {
      throw new GroupInviteNotFoundException(groupInviteId);
    }

    const groupId = groupInvite.groupId;
    const memberCount = await this.userGroupRepository.countMembers(groupId);
    const isGroupFull = memberCount >= MAX_GROUP_MEMBERS;

    if (isGroupFull) {
      throw new GroupFullException();
    }

    const acceptedInvite = await this.groupInviteRepository.updateStatus(
      groupInviteId,
      "accepted",
    );

    await this.userGroupRepository.addMember(groupId, inviteeId);

    Logger.info("Group invite accepted", {
      groupInviteId,
      groupId,
      inviteeId,
      inviterId: acceptedInvite.inviterId,
    });

    return acceptedInvite;
  }
}
