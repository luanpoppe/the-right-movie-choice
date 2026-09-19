import { Logger } from "@/lib/logger/logger";
import type { UserPublicEntity } from "../../domain/entities/friend-request.entity";
import { NotGroupMemberException } from "../../domain/exceptions/not-group-member.exception";
import { UserGroupNotFoundException } from "../../domain/exceptions/user-group-not-found.exception";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export class ListGroupMembersUseCase {
  constructor(private readonly userGroupRepository: IUserGroupRepository) {}

  async execute(userId: number, groupId: number): Promise<UserPublicEntity[]> {
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

    const members = await this.userGroupRepository.findMemberProfiles(groupId);

    Logger.info("Group members listed", {
      groupId,
      userId,
      count: members.length,
    });

    return members;
  }
}
