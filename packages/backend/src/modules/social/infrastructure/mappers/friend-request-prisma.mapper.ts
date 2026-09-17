import {
  FriendRequestStatus as PrismaFriendRequestStatusEnum,
  type FriendRequest as PrismaFriendRequest,
  type User as PrismaUser,
} from "../../../../../generated/prisma/client.js";
import type {
  FriendRequestEntity,
  IncomingFriendRequestEntity,
  OutgoingFriendRequestEntity,
  UserPublicEntity,
} from "../../domain/entities/friend-request.entity";
import type { FriendRequestStatus } from "../../domain/types/relationship-status.type";

type PrismaUserPublicFields = Pick<PrismaUser, "id" | "name" | "email">;

type PrismaFriendRequestWithRequester = PrismaFriendRequest & {
  requester: PrismaUserPublicFields;
};

type PrismaFriendRequestWithAddressee = PrismaFriendRequest & {
  addressee: PrismaUserPublicFields;
};

export class FriendRequestPrismaMapper {
  static toEntity(row: PrismaFriendRequest): FriendRequestEntity {
    const status = FriendRequestPrismaMapper.toDomainStatus(row.status);

    return {
      id: row.id,
      requesterId: row.requesterId,
      addresseeId: row.addresseeId,
      status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  static toUserPublic(user: PrismaUserPublicFields): UserPublicEntity {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  static toIncomingEntity(
    row: PrismaFriendRequestWithRequester,
  ): IncomingFriendRequestEntity {
    const status = FriendRequestPrismaMapper.toDomainStatus(row.status);
    const requester = FriendRequestPrismaMapper.toUserPublic(row.requester);

    return {
      id: row.id,
      requester,
      status,
      createdAt: row.createdAt,
    };
  }

  static toOutgoingEntity(
    row: PrismaFriendRequestWithAddressee,
  ): OutgoingFriendRequestEntity {
    const status = FriendRequestPrismaMapper.toDomainStatus(row.status);
    const addressee = FriendRequestPrismaMapper.toUserPublic(row.addressee);

    return {
      id: row.id,
      addressee,
      status,
      createdAt: row.createdAt,
    };
  }

  static toDomainStatus(
    status: PrismaFriendRequestStatusEnum,
  ): FriendRequestStatus {
    if (status === PrismaFriendRequestStatusEnum.pending) {
      return "pending";
    }

    if (status === PrismaFriendRequestStatusEnum.accepted) {
      return "accepted";
    }

    if (status === PrismaFriendRequestStatusEnum.rejected) {
      return "rejected";
    }

    return status;
  }

  static toPrismaStatus(
    status: FriendRequestStatus,
  ): PrismaFriendRequestStatusEnum {
    if (status === "pending") {
      return PrismaFriendRequestStatusEnum.pending;
    }

    if (status === "accepted") {
      return PrismaFriendRequestStatusEnum.accepted;
    }

    if (status === "rejected") {
      return PrismaFriendRequestStatusEnum.rejected;
    }

    return status;
  }
}
