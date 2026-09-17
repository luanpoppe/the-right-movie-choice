import { Logger } from "@/lib/logger/logger";
import type { UserGroupEntity } from "../../domain/entities/user-group.entity";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export class CreateUserGroupUseCase {
  constructor(private readonly userGroupRepository: IUserGroupRepository) {}

  async execute(
    ownerId: number,
    name: string,
    description?: string,
  ): Promise<UserGroupEntity> {
    UserGroupValidationUtils.assertValidUserId(ownerId);
    UserGroupValidationUtils.assertValidName(name);
    UserGroupValidationUtils.assertValidDescription(description);

    const createdGroup = await this.userGroupRepository.createWithOwner(
      ownerId,
      name,
      description,
    );

    Logger.info("User group created", {
      groupId: createdGroup.id,
      ownerId,
      name: createdGroup.name,
    });

    return createdGroup;
  }
}
