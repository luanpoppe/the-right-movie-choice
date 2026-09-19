import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { PrismaErrorMapper } from "@/shared/mappers/prisma-error.mapper";
import type {
  GroupInviteEntity,
  IncomingGroupInviteEntity,
} from "../../../domain/entities/group-invite.entity";
import { GroupFullException } from "../../../domain/exceptions/group-full.exception";
import { GroupInviteAlreadyPendingException } from "../../../domain/exceptions/group-invite-already-pending.exception";
import { GroupInviteNotFoundException } from "../../../domain/exceptions/group-invite-not-found.exception";
import type { IGroupInviteRepository } from "../../../domain/repositories/group-invite.repository";
import type { GroupInviteStatus } from "../../../domain/types/group-invite-status.type";
import {
  MAX_GROUP_MEMBERS,
  UserGroupValidationUtils,
} from "../../../domain/utils/user-group-validation.utils";
import { GroupInvitePrismaMapper } from "../../mappers/group-invite-prisma.mapper";

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
} as const;

const groupSummarySelect = {
  id: true,
  name: true,
} as const;

const latestPendingOrderBy = [
  { createdAt: "desc" as const },
  { id: "desc" as const },
];

const incomingPendingOrderBy = { createdAt: "desc" as const };

export class PrismaGroupInviteRepository implements IGroupInviteRepository {
  async findById(id: number): Promise<GroupInviteEntity | null> {
    UserGroupValidationUtils.assertValidGroupInviteId(id);

    const row = await prisma.groupInvite.findUnique({ where: { id } });

    if (!row) {
      return null;
    }

    const entity = GroupInvitePrismaMapper.toEntity(row);
    return entity;
  }

  async findLatestPending(
    groupId: number,
    inviteeId: number,
  ): Promise<GroupInviteEntity | null> {
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UserGroupValidationUtils.assertValidUserId(inviteeId);

    const where = {
      groupId,
      inviteeId,
      status: "pending" as const,
    };
    const row = await prisma.groupInvite.findFirst({
      where,
      orderBy: latestPendingOrderBy,
    });

    if (!row) {
      return null;
    }

    const entity = GroupInvitePrismaMapper.toEntity(row);
    return entity;
  }

  async createPending(
    groupId: number,
    inviterId: number,
    inviteeId: number,
  ): Promise<GroupInviteEntity> {
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UserGroupValidationUtils.assertNotSelf(inviterId, inviteeId);

    const row = await prisma.groupInvite.create({
      data: {
        groupId,
        inviterId,
        inviteeId,
        status: "pending",
      },
    });

    Logger.info("Group invite created", {
      groupInviteId: row.id,
      groupId,
      inviterId,
      inviteeId,
    });

    const entity = GroupInvitePrismaMapper.toEntity(row);
    return entity;
  }

  async updateStatus(
    id: number,
    status: GroupInviteStatus,
  ): Promise<GroupInviteEntity> {
    UserGroupValidationUtils.assertValidGroupInviteId(id);

    const prismaStatus = GroupInvitePrismaMapper.toPrismaStatus(status);

    try {
      const row = await prisma.groupInvite.update({
        where: { id },
        data: { status: prismaStatus },
      });

      Logger.info("Group invite status updated", {
        groupInviteId: id,
        status,
      });

      const entity = GroupInvitePrismaMapper.toEntity(row);
      return entity;
    } catch (error) {
      const notFoundException = new GroupInviteNotFoundException(id);
      PrismaErrorMapper.mapRecordNotFoundOrRethrow(error, notFoundException);
    }
  }

  async deleteById(id: number): Promise<void> {
    UserGroupValidationUtils.assertValidGroupInviteId(id);

    try {
      await prisma.groupInvite.delete({ where: { id } });

      Logger.info("Group invite deleted", { groupInviteId: id });
    } catch (error) {
      const notFoundException = new GroupInviteNotFoundException(id);
      PrismaErrorMapper.mapRecordNotFoundOrRethrow(error, notFoundException);
    }
  }

  async listIncomingPending(
    inviteeId: number,
  ): Promise<IncomingGroupInviteEntity[]> {
    UserGroupValidationUtils.assertValidUserId(inviteeId);

    const where = {
      inviteeId,
      status: "pending" as const,
    };
    const rows = await prisma.groupInvite.findMany({
      where,
      include: {
        group: { select: groupSummarySelect },
        inviter: { select: userPublicSelect },
      },
      orderBy: incomingPendingOrderBy,
    });

    const entities = rows.map((row) =>
      GroupInvitePrismaMapper.toIncomingEntity(row),
    );
    return entities;
  }

  async hasPendingInvite(groupId: number, inviteeId: number): Promise<boolean> {
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UserGroupValidationUtils.assertValidUserId(inviteeId);

    const where = {
      groupId,
      inviteeId,
      status: "pending" as const,
    };
    const count = await prisma.groupInvite.count({ where });
    const hasPendingInvite = count > 0;

    return hasPendingInvite;
  }

  async acceptPendingAndAddMember(
    inviteId: number,
    groupId: number,
    inviteeId: number,
  ): Promise<GroupInviteEntity> {
    UserGroupValidationUtils.assertValidGroupInviteId(inviteId);
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UserGroupValidationUtils.assertValidUserId(inviteeId);

    const acceptedInvite = await prisma.$transaction(async (tx) => {
      const memberWhere = { groupId };
      const memberCount = await tx.groupMember.count({ where: memberWhere });
      const isGroupFull = memberCount >= MAX_GROUP_MEMBERS;

      if (isGroupFull) {
        throw new GroupFullException();
      }

      const prismaStatus = GroupInvitePrismaMapper.toPrismaStatus("accepted");
      const inviteRow = await tx.groupInvite.update({
        where: { id: inviteId },
        data: { status: prismaStatus },
      });

      await tx.groupMember.create({
        data: { groupId, userId: inviteeId },
      });

      const entity = GroupInvitePrismaMapper.toEntity(inviteRow);
      return entity;
    });

    Logger.info("Group invite accepted and member added", {
      groupInviteId: inviteId,
      groupId,
      inviteeId,
    });

    return acceptedInvite;
  }

  async createPendingIfAvailable(
    groupId: number,
    inviterId: number,
    inviteeId: number,
  ): Promise<GroupInviteEntity> {
    UserGroupValidationUtils.assertValidGroupId(groupId);
    UserGroupValidationUtils.assertNotSelf(inviterId, inviteeId);

    const createdInvite = await prisma.$transaction(async (tx) => {
      const memberWhere = { groupId };
      const memberCount = await tx.groupMember.count({ where: memberWhere });
      const isGroupFull = memberCount >= MAX_GROUP_MEMBERS;

      if (isGroupFull) {
        throw new GroupFullException();
      }

      const pendingWhere = {
        groupId,
        inviteeId,
        status: "pending" as const,
      };
      const pendingCount = await tx.groupInvite.count({ where: pendingWhere });
      const hasPendingInvite = pendingCount > 0;

      if (hasPendingInvite) {
        throw new GroupInviteAlreadyPendingException();
      }

      const inviteRow = await tx.groupInvite.create({
        data: {
          groupId,
          inviterId,
          inviteeId,
          status: "pending",
        },
      });

      const entity = GroupInvitePrismaMapper.toEntity(inviteRow);
      return entity;
    });

    Logger.info("Group invite created", {
      groupInviteId: createdInvite.id,
      groupId,
      inviterId,
      inviteeId,
    });

    return createdInvite;
  }

  async findPendingInviteeUserIds(groupId: number): Promise<number[]> {
    UserGroupValidationUtils.assertValidGroupId(groupId);

    const where = {
      groupId,
      status: "pending" as const,
    };
    const rows = await prisma.groupInvite.findMany({
      where,
      select: { inviteeId: true },
    });

    const inviteeUserIds = rows.map((row) => row.inviteeId);
    return inviteeUserIds;
  }
}
