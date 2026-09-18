import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { PrismaErrorMapper } from "@/shared/mappers/prisma-error.mapper";
import type { GroupMemberEntity } from "../../../domain/entities/group-member.entity";
import type {
  UserGroupEntity,
  UserGroupListItemEntity,
} from "../../../domain/entities/user-group.entity";
import { UserGroupNotFoundException } from "../../../domain/exceptions/user-group-not-found.exception";
import type { IUserGroupRepository } from "../../../domain/repositories/user-group.repository";
import { UserGroupValidationUtils } from "../../../domain/utils/user-group-validation.utils";
import { UserGroupPrismaMapper } from "../../mappers/user-group-prisma.mapper";

const listGroupsOrderBy = { joinedAt: "desc" as const };
const oldestMemberOrderBy = { joinedAt: "asc" as const };

export class PrismaUserGroupRepository implements IUserGroupRepository {
  async findById(groupId: number): Promise<UserGroupEntity | null> {
    UserGroupValidationUtils.assertValidGroupId(groupId);

    const row = await prisma.userGroup.findUnique({ where: { id: groupId } });

    if (!row) {
      return null;
    }

    const entity = UserGroupPrismaMapper.toUserGroupEntity(row);
    return entity;
  }

  async createWithOwner(
    ownerId: number,
    name: string,
    description?: string,
  ): Promise<UserGroupEntity> {
    UserGroupValidationUtils.assertValidUserId(ownerId);
    UserGroupValidationUtils.assertValidName(name);
    UserGroupValidationUtils.assertValidDescription(description);

    const trimmedName = name.trim();

    const row = await prisma.$transaction(async (tx) => {
      const createData: {
        name: string;
        ownerId: number;
        description?: string;
      } = {
        name: trimmedName,
        ownerId,
      };

      if (description !== undefined) {
        createData.description = description;
      }

      const group = await tx.userGroup.create({
        data: createData,
      });

      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: ownerId,
        },
      });

      return group;
    });

    Logger.info("User group created with owner", {
      groupId: row.id,
      ownerId,
      name: trimmedName,
    });

    const entity = UserGroupPrismaMapper.toUserGroupEntity(row);
    return entity;
  }

  async updateGroup(
    groupId: number,
    patch: { name?: string; description?: string | null },
  ): Promise<UserGroupEntity> {
    UserGroupValidationUtils.assertValidGroupId(groupId);

    if (patch.name !== undefined) {
      UserGroupValidationUtils.assertValidName(patch.name);
    }

    if (patch.description !== undefined) {
      UserGroupValidationUtils.assertValidDescription(patch.description);
    }

    const data: { name?: string; description?: string | null } = {};

    if (patch.name !== undefined) {
      const trimmedName = patch.name.trim();
      data.name = trimmedName;
    }

    if (patch.description !== undefined) {
      data.description = patch.description;
    }

    try {
      const row = await prisma.userGroup.update({
        where: { id: groupId },
        data,
      });

      Logger.info("User group updated", { groupId });

      const entity = UserGroupPrismaMapper.toUserGroupEntity(row);
      return entity;
    } catch (error) {
      const notFoundException = new UserGroupNotFoundException(groupId);
      PrismaErrorMapper.mapRecordNotFoundOrRethrow(error, notFoundException);
    }
  }

  async deleteGroup(groupId: number): Promise<void> {
    UserGroupValidationUtils.assertValidGroupId(groupId);

    try {
      await prisma.userGroup.delete({ where: { id: groupId } });

      Logger.info("User group deleted", { groupId });
    } catch (error) {
      const notFoundException = new UserGroupNotFoundException(groupId);
      PrismaErrorMapper.mapRecordNotFoundOrRethrow(error, notFoundException);
    }
  }

  async listGroupsForUser(userId: number): Promise<UserGroupListItemEntity[]> {
    UserGroupValidationUtils.assertValidUserId(userId);

    const rows = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: listGroupsOrderBy,
    });

    const entities = rows.map((row) => {
      const memberCount = row.group._count.members;
      const joinedAt = row.joinedAt;
      const listItem = UserGroupPrismaMapper.toUserGroupListItemEntity(
        row.group,
        memberCount,
        joinedAt,
      );

      return listItem;
    });

    return entities;
  }

  async findMembership(
    groupId: number,
    userId: number,
  ): Promise<GroupMemberEntity | null> {
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UserGroupValidationUtils.assertValidUserId(userId);

    const where = { groupId_userId: { groupId, userId } };
    const row = await prisma.groupMember.findUnique({ where });

    if (!row) {
      return null;
    }

    const entity = UserGroupPrismaMapper.toGroupMemberEntity(row);
    return entity;
  }

  async isOwner(groupId: number, userId: number): Promise<boolean> {
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UserGroupValidationUtils.assertValidUserId(userId);

    const row = await prisma.userGroup.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });

    if (!row) {
      return false;
    }

    const isOwner = row.ownerId === userId;
    return isOwner;
  }

  async countMembers(groupId: number): Promise<number> {
    UserGroupValidationUtils.assertValidGroupId(groupId);

    const where = { groupId };
    const count = await prisma.groupMember.count({ where });
    return count;
  }

  async addMember(groupId: number, userId: number): Promise<GroupMemberEntity> {
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UserGroupValidationUtils.assertValidUserId(userId);

    const row = await prisma.groupMember.create({
      data: { groupId, userId },
    });

    Logger.info("User added to group", { groupId, userId });

    const entity = UserGroupPrismaMapper.toGroupMemberEntity(row);
    return entity;
  }

  async removeMember(groupId: number, userId: number): Promise<void> {
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UserGroupValidationUtils.assertValidUserId(userId);

    const where = { groupId_userId: { groupId, userId } };
    await prisma.groupMember.delete({ where });

    Logger.info("User removed from group", { groupId, userId });
  }

  async transferOwnership(
    groupId: number,
    newOwnerId: number,
  ): Promise<UserGroupEntity> {
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UserGroupValidationUtils.assertValidUserId(newOwnerId);

    try {
      const row = await prisma.userGroup.update({
        where: { id: groupId },
        data: { ownerId: newOwnerId },
      });

      Logger.info("User group ownership transferred", {
        groupId,
        newOwnerId,
      });

      const entity = UserGroupPrismaMapper.toUserGroupEntity(row);
      return entity;
    } catch (error) {
      const notFoundException = new UserGroupNotFoundException(groupId);
      PrismaErrorMapper.mapRecordNotFoundOrRethrow(error, notFoundException);
    }
  }

  async findOldestMemberAfterOwner(
    groupId: number,
    excludingUserId: number,
  ): Promise<GroupMemberEntity | null> {
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UserGroupValidationUtils.assertValidUserId(excludingUserId);

    const where = {
      groupId,
      userId: { not: excludingUserId },
    };
    const row = await prisma.groupMember.findFirst({
      where,
      orderBy: oldestMemberOrderBy,
    });

    if (!row) {
      return null;
    }

    const entity = UserGroupPrismaMapper.toGroupMemberEntity(row);
    return entity;
  }

  async deleteGroupAndRelated(groupId: number): Promise<void> {
    await this.deleteGroup(groupId);
  }

  async findMemberUserIds(groupId: number): Promise<number[]> {
    UserGroupValidationUtils.assertValidGroupId(groupId);

    const where = { groupId };
    const rows = await prisma.groupMember.findMany({
      where,
      select: { userId: true },
    });

    const userIds = rows.map((row) => row.userId);
    return userIds;
  }

  async leaveAsOwnerWithTransfer(
    groupId: number,
    ownerId: number,
  ): Promise<void> {
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UserGroupValidationUtils.assertValidUserId(ownerId);

    await prisma.$transaction(async (tx) => {
      const memberWhere = {
        groupId,
        userId: { not: ownerId },
      };
      const nextOwnerRow = await tx.groupMember.findFirst({
        where: memberWhere,
        orderBy: oldestMemberOrderBy,
      });

      if (!nextOwnerRow) {
        throw new UserGroupNotFoundException(groupId);
      }

      const newOwnerId = nextOwnerRow.userId;

      await tx.userGroup.update({
        where: { id: groupId },
        data: { ownerId: newOwnerId },
      });

      const ownerMembershipWhere = {
        groupId_userId: { groupId, userId: ownerId },
      };
      await tx.groupMember.delete({ where: ownerMembershipWhere });
    });

    Logger.info("Owner left group after transferring ownership", {
      groupId,
      previousOwnerId: ownerId,
    });
  }
}
