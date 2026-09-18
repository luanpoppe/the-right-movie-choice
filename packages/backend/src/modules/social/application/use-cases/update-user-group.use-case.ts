import { Logger } from "@/lib/logger/logger";
import type { UserGroupEntity } from "../../domain/entities/user-group.entity";
import { NotGroupOwnerException } from "../../domain/exceptions/not-group-owner.exception";
import { UserGroupValidationException } from "../../domain/exceptions/user-group-validation.exception";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export type UpdateUserGroupPatch = {
  name?: string;
  description?: string | null;
};

export class UpdateUserGroupUseCase {
  constructor(private readonly userGroupRepository: IUserGroupRepository) {}

  async execute(
    ownerId: number,
    groupId: number,
    patch: UpdateUserGroupPatch,
  ): Promise<UserGroupEntity> {
    UserGroupValidationUtils.assertValidUserId(ownerId);
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UpdateUserGroupUseCase.assertNonEmptyPatch(patch);

    const hasName = patch.name !== undefined;
    const hasDescription = patch.description !== undefined;

    if (hasName) {
      const name = patch.name as string;
      UserGroupValidationUtils.assertValidName(name);
    }

    if (hasDescription) {
      const description = patch.description;
      UserGroupValidationUtils.assertValidDescription(description);
    }

    const isOwner = await this.userGroupRepository.isOwner(groupId, ownerId);

    if (!isOwner) {
      throw new NotGroupOwnerException(groupId);
    }

    const updatedGroup = await this.userGroupRepository.updateGroup(
      groupId,
      patch,
    );

    Logger.info("User group updated", {
      groupId,
      ownerId,
      hasName,
      hasDescription,
    });

    return updatedGroup;
  }

  private static assertNonEmptyPatch(patch: UpdateUserGroupPatch): void {
    const hasName = patch.name !== undefined;
    const hasDescription = patch.description !== undefined;
    const isEmptyPatch = !hasName && !hasDescription;

    if (isEmptyPatch) {
      throw new UserGroupValidationException(
        "patch must contain at least one field to update",
      );
    }
  }
}
