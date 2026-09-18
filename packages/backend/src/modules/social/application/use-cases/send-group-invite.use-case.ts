import { Logger } from "@/lib/logger/logger";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import type { GroupInviteEntity } from "../../domain/entities/group-invite.entity";
import { AlreadyGroupMemberException } from "../../domain/exceptions/already-group-member.exception";
import { GroupInviteAlreadyPendingException } from "../../domain/exceptions/group-invite-already-pending.exception";
import { NotGroupMemberException } from "../../domain/exceptions/not-group-member.exception";
import { SelfGroupInviteException } from "../../domain/exceptions/self-group-invite.exception";
import { UserNotFoundByEmailException } from "../../domain/exceptions/user-not-found-by-email.exception";
import type { IGroupInviteRepository } from "../../domain/repositories/group-invite.repository";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export class SendGroupInviteUseCase {
  constructor(
    private readonly groupInviteRepository: IGroupInviteRepository,
    private readonly userGroupRepository: IUserGroupRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    inviterId: number,
    groupId: number,
    email: string,
  ): Promise<GroupInviteEntity> {
    UserGroupValidationUtils.assertValidUserId(inviterId);
    UserGroupValidationUtils.assertValidGroupId(groupId);

    const normalizedEmail = UserGroupValidationUtils.normalizeEmail(email);

    const inviterMembership = await this.userGroupRepository.findMembership(
      groupId,
      inviterId,
    );

    if (!inviterMembership) {
      throw new NotGroupMemberException(groupId);
    }

    const inviteeUser =
      await this.userRepository.findByEmailCaseInsensitive(normalizedEmail);

    if (!inviteeUser) {
      throw new UserNotFoundByEmailException(normalizedEmail);
    }

    const inviteeId = inviteeUser.id;
    const isSelfInvite = inviterId === inviteeId;

    if (isSelfInvite) {
      throw new SelfGroupInviteException();
    }

    const inviteeMembership = await this.userGroupRepository.findMembership(
      groupId,
      inviteeId,
    );

    if (inviteeMembership) {
      throw new AlreadyGroupMemberException();
    }

    const hasPendingInvite = await this.groupInviteRepository.hasPendingInvite(
      groupId,
      inviteeId,
    );

    if (hasPendingInvite) {
      throw new GroupInviteAlreadyPendingException();
    }

    const createdInvite = await this.groupInviteRepository.createPending(
      groupId,
      inviterId,
      inviteeId,
    );

    Logger.info("Group invite sent", {
      groupInviteId: createdInvite.id,
      groupId,
      inviterId,
      inviteeId,
      status: createdInvite.status,
    });

    return createdInvite;
  }
}
