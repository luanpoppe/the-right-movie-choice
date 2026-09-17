import { Logger } from "@/lib/logger/logger";
import type { UserGroupListItemEntity } from "../../domain/entities/user-group.entity";
import type { IUserGroupRepository } from "../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../domain/utils/user-group-validation.utils";

export class ListUserGroupsUseCase {
  constructor(private readonly userGroupRepository: IUserGroupRepository) {}

  async execute(userId: number): Promise<UserGroupListItemEntity[]> {
    UserGroupValidationUtils.assertValidUserId(userId);

    const groups = await this.userGroupRepository.listGroupsForUser(userId);

    Logger.info("User groups listed", {
      userId,
      count: groups.length,
    });

    return groups;
  }
}
