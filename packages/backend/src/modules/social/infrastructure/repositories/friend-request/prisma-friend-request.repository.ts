import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import type {
  FriendRequestEntity,
  IncomingFriendRequestEntity,
  OutgoingFriendRequestEntity,
  UserPublicEntity,
} from "../../../domain/entities/friend-request.entity";
import type { IFriendRequestRepository } from "../../../domain/repositories/friend-request.repository";
import type {
  FriendRequestStatus,
  RelationshipStatus,
} from "../../../domain/types/relationship-status.type";
import { FriendRequestValidationUtils } from "../../../domain/utils/friend-request-validation.utils";
import { FriendRequestPrismaMapper } from "../../mappers/friend-request-prisma.mapper";

export class PrismaFriendRequestRepository implements IFriendRequestRepository {
  async findById(id: number): Promise<FriendRequestEntity | null> {
    FriendRequestValidationUtils.assertValidUserId(id);

    const row = await prisma.friendRequest.findUnique({ where: { id } });

    if (!row) {
      return null;
    }

    const entity = FriendRequestPrismaMapper.toEntity(row);
    return entity;
  }

  async findLatestBetweenUsers(
    firstUserId: number,
    secondUserId: number,
  ): Promise<FriendRequestEntity | null> {
    FriendRequestValidationUtils.assertValidUserId(firstUserId);
    FriendRequestValidationUtils.assertValidUserId(secondUserId);

    const where = {
      OR: [
        { requesterId: firstUserId, addresseeId: secondUserId },
        { requesterId: secondUserId, addresseeId: firstUserId },
      ],
    };
    const orderBy = { createdAt: "desc" as const };
    const row = await prisma.friendRequest.findFirst({ where, orderBy });

    if (!row) {
      return null;
    }

    const entity = FriendRequestPrismaMapper.toEntity(row);
    return entity;
  }

  async createPending(
    requesterId: number,
    addresseeId: number,
  ): Promise<FriendRequestEntity> {
    FriendRequestValidationUtils.assertNotSelf(requesterId, addresseeId);

    const row = await prisma.friendRequest.create({
      data: {
        requesterId,
        addresseeId,
        status: "pending",
      },
    });

    Logger.info("Friend request created", {
      friendRequestId: row.id,
      requesterId,
      addresseeId,
    });

    const entity = FriendRequestPrismaMapper.toEntity(row);
    return entity;
  }

  async updateStatus(
    id: number,
    status: FriendRequestStatus,
  ): Promise<FriendRequestEntity> {
    FriendRequestValidationUtils.assertValidUserId(id);

    const prismaStatus = FriendRequestPrismaMapper.toPrismaStatus(status);
    const row = await prisma.friendRequest.update({
      where: { id },
      data: { status: prismaStatus },
    });

    Logger.info("Friend request status updated", {
      friendRequestId: id,
      status,
    });

    const entity = FriendRequestPrismaMapper.toEntity(row);
    return entity;
  }

  async deleteById(id: number): Promise<void> {
    FriendRequestValidationUtils.assertValidUserId(id);

    await prisma.friendRequest.delete({ where: { id } });

    Logger.info("Friend request deleted", { friendRequestId: id });
  }

  async listAcceptedFriends(userId: number): Promise<UserPublicEntity[]> {
    FriendRequestValidationUtils.assertValidUserId(userId);

    const where = {
      status: "accepted" as const,
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    };
    const include = {
      requester: true,
      addressee: true,
    };
    const rows = await prisma.friendRequest.findMany({ where, include });

    const friends = rows.map((row) => {
      const isRequester = row.requesterId === userId;
      const friendUser = isRequester ? row.addressee : row.requester;
      const friend = FriendRequestPrismaMapper.toUserPublic(friendUser);
      return friend;
    });

    return friends;
  }

  async listIncomingPending(
    userId: number,
  ): Promise<IncomingFriendRequestEntity[]> {
    FriendRequestValidationUtils.assertValidUserId(userId);

    const where = {
      addresseeId: userId,
      status: "pending" as const,
    };
    const include = { requester: true };
    const orderBy = { createdAt: "desc" as const };
    const rows = await prisma.friendRequest.findMany({
      where,
      include,
      orderBy,
    });

    const entities = rows.map((row) =>
      FriendRequestPrismaMapper.toIncomingEntity(row),
    );
    return entities;
  }

  async listOutgoingPending(
    userId: number,
  ): Promise<OutgoingFriendRequestEntity[]> {
    FriendRequestValidationUtils.assertValidUserId(userId);

    const where = {
      requesterId: userId,
      status: "pending" as const,
    };
    const include = { addressee: true };
    const orderBy = { createdAt: "desc" as const };
    const rows = await prisma.friendRequest.findMany({
      where,
      include,
      orderBy,
    });

    const entities = rows.map((row) =>
      FriendRequestPrismaMapper.toOutgoingEntity(row),
    );
    return entities;
  }

  async resolveRelationshipStatus(
    viewerUserId: number,
    otherUserId: number,
  ): Promise<RelationshipStatus> {
    FriendRequestValidationUtils.assertValidUserId(viewerUserId);
    FriendRequestValidationUtils.assertValidUserId(otherUserId);

    const latest = await this.findLatestBetweenUsers(
      viewerUserId,
      otherUserId,
    );

    if (!latest) {
      return "none";
    }

    const isAccepted = latest.status === "accepted";
    if (isAccepted) {
      return "friends";
    }

    const isRejected = latest.status === "rejected";
    if (isRejected) {
      return "rejected";
    }

    const isViewerRequester = latest.requesterId === viewerUserId;
    if (isViewerRequester) {
      return "pending_outgoing";
    }

    return "pending_incoming";
  }
}
