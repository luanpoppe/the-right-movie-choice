import { Logger } from "@/lib/logger/logger";
import { NotGroupMemberException } from "../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../domain/exceptions/user-group-not-found.exception";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export class LeaveUserGroupUseCase {
  constructor(private readonly userGroupRepository: IUserGroupRepository) {}

  async execute(userId: number, groupId: number): Promise<void> {
    UserGroupValidationUtils.assertValidUserId(userId);
    UserGroupValidationUtils.assertValidGroupId(groupId);

    const group = await this.userGroupRepository.findById(groupId);

    if (!group) {
      throw new UserGroupNotFoundException(groupId);
    }

    const membership = await this.userGroupRepository.findMembership(
      groupId,
      userId,
    );

    if (!membership) {
      throw new NotGroupMemberException(groupId);
    }

    const isOwner = await this.userGroupRepository.isOwner(groupId, userId);

    if (!isOwner) {
      await this.userGroupRepository.removeMember(groupId, userId);

      Logger.info("User left group", {
        groupId,
        userId,
      });

      return;
    }

    const memberCount = await this.userGroupRepository.countMembers(groupId);
    const isSoleMember = memberCount === 1;

    if (isSoleMember) {
      await this.userGroupRepository.deleteGroupAndRelated(groupId);

      Logger.info("User group dissolved because sole owner left", {
        groupId,
        userId,
      });

      return;
    }

    await this.userGroupRepository.leaveAsOwnerWithTransfer(groupId, userId);

    Logger.info("Owner left group after transferring ownership", {
      groupId,
      previousOwnerId: userId,
    });
  }
}
