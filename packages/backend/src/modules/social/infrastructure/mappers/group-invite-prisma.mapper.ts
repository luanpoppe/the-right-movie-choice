import {
  GroupInviteStatus as PrismaGroupInviteStatusEnum,
  type GroupInvite as PrismaGroupInvite,
  type User as PrismaUser,
  type UserGroup as PrismaUserGroup,
} from "../../../../../generated/prisma/client.js";
import type {
  GroupInviteEntity,
  IncomingGroupInviteEntity,
} from "../../domain/entities/group-invite.entity";
import type { GroupInviteStatus } from "../../domain/types/group-invite-status.type";
import { FriendRequestPrismaMapper } from "./friend-request-prisma.mapper";

type PrismaUserPublicFields = Pick<PrismaUser, "id" | "name" | "email">;

type PrismaGroupInviteWithDetails = PrismaGroupInvite & {
  group: Pick<PrismaUserGroup, "id" | "name">;
  inviter: PrismaUserPublicFields;
};

export class GroupInvitePrismaMapper {
  static toEntity(row: PrismaGroupInvite): GroupInviteEntity {
    const status = GroupInvitePrismaMapper.toDomainStatus(row.status);

    return {
      id: row.id,
      groupId: row.groupId,
      inviterId: row.inviterId,
      inviteeId: row.inviteeId,
      status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  static toIncomingEntity(
    row: PrismaGroupInviteWithDetails,
  ): IncomingGroupInviteEntity {
    const status = GroupInvitePrismaMapper.toDomainStatus(row.status);
    const inviter = FriendRequestPrismaMapper.toUserPublic(row.inviter);

    return {
      id: row.id,
      group: {
        id: row.group.id,
        name: row.group.name,
      },
      inviter,
      status,
      createdAt: row.createdAt,
    };
  }

  static toDomainStatus(
    status: PrismaGroupInviteStatusEnum,
  ): GroupInviteStatus {
    if (status === PrismaGroupInviteStatusEnum.pending) {
      return "pending";
    }

    if (status === PrismaGroupInviteStatusEnum.accepted) {
      return "accepted";
    }

    if (status === PrismaGroupInviteStatusEnum.rejected) {
      return "rejected";
    }

    return status;
  }

  static toPrismaStatus(
    status: GroupInviteStatus,
  ): PrismaGroupInviteStatusEnum {
    if (status === "pending") {
      return PrismaGroupInviteStatusEnum.pending;
    }

    if (status === "accepted") {
      return PrismaGroupInviteStatusEnum.accepted;
    }

    if (status === "rejected") {
      return PrismaGroupInviteStatusEnum.rejected;
    }

    return status;
  }
}
