import type {
  GroupMember as PrismaGroupMember,
  UserGroup as PrismaUserGroup,
} from "../../../../../generated/prisma/client.js";
import type { GroupMemberEntity } from "../../domain/entities/group-member.entity";
import type {
  UserGroupEntity,
  UserGroupListItemEntity,
} from "../../domain/entities/user-group.entity";

export class UserGroupPrismaMapper {
  static toUserGroupEntity(row: PrismaUserGroup): UserGroupEntity {
    const entity: UserGroupEntity = {
      id: row.id,
      name: row.name,
      ownerId: row.ownerId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    if (row.description != null) {
      entity.description = row.description;
    }

    return entity;
  }

  static toGroupMemberEntity(row: PrismaGroupMember): GroupMemberEntity {
    return {
      groupId: row.groupId,
      userId: row.userId,
      joinedAt: row.joinedAt,
    };
  }

  static toUserGroupListItemEntity(
    group: PrismaUserGroup,
    memberCount: number,
    joinedAt: Date,
  ): UserGroupListItemEntity {
    const listItem: UserGroupListItemEntity = {
      id: group.id,
      name: group.name,
      ownerId: group.ownerId,
      memberCount,
      joinedAt,
    };

    if (group.description != null) {
      listItem.description = group.description;
    }

    return listItem;
  }
}
