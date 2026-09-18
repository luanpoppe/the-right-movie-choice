import { Logger } from "@/lib/logger/logger";
import { NotGroupOwnerException } from "../../domain/exceptions/not-group-owner.exception";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export class DeleteUserGroupUseCase {
  constructor(private readonly userGroupRepository: IUserGroupRepository) {}

  async execute(ownerId: number, groupId: number): Promise<void> {
    UserGroupValidationUtils.assertValidUserId(ownerId);
    UserGroupValidationUtils.assertValidGroupId(groupId);

    const isOwner = await this.userGroupRepository.isOwner(groupId, ownerId);

    if (!isOwner) {
      throw new NotGroupOwnerException(groupId);
    }

    await this.userGroupRepository.deleteGroup(groupId);

    Logger.info("User group deleted", {
      groupId,
      ownerId,
    });
  }
}
