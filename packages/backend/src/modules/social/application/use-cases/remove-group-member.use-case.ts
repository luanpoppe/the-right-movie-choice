import { Logger } from "@/lib/logger/logger";
import { NotGroupMemberException } from "../../domain/exceptions/not-group-member.exception";
import { NotGroupOwnerException } from "../../domain/exceptions/not-group-owner.exception";
import { UserGroupNotFoundException } from "../../domain/exceptions/user-group-not-found.exception";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export class RemoveGroupMemberUseCase {
  constructor(private readonly userGroupRepository: IUserGroupRepository) {}

  async execute(
    ownerId: number,
    groupId: number,
    targetMemberId: number,
  ): Promise<void> {
    UserGroupValidationUtils.assertValidUserId(ownerId);
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UserGroupValidationUtils.assertValidUserId(targetMemberId);

    const group = await this.userGroupRepository.findById(groupId);

    if (!group) {
      throw new UserGroupNotFoundException(groupId);
    }

    const isOwner = await this.userGroupRepository.isOwner(groupId, ownerId);

    if (!isOwner) {
      throw new NotGroupOwnerException(groupId);
    }

    const isRemovingSelf = targetMemberId === ownerId;

    if (isRemovingSelf) {
      throw new NotGroupMemberException(groupId);
    }

    const targetMembership = await this.userGroupRepository.findMembership(
      groupId,
      targetMemberId,
    );

    if (!targetMembership) {
      throw new NotGroupMemberException(groupId);
    }

    await this.userGroupRepository.removeMember(groupId, targetMemberId);

    Logger.info("Group member removed by owner", {
      groupId,
      ownerId,
      removedMemberId: targetMemberId,
    });
  }
}
