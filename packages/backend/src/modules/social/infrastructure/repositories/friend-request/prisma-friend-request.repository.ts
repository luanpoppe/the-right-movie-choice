import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { PrismaErrorMapper } from "@/shared/mappers/prisma-error.mapper";
import type {
  FriendRequestEntity,
  IncomingFriendRequestEntity,
  OutgoingFriendRequestEntity,
  UserPublicEntity,
} from "../../../domain/entities/friend-request.entity";
import { AlreadyFriendsException } from "../../../domain/exceptions/already-friends.exception";
import { FriendRequestAlreadyPendingException } from "../../../domain/exceptions/friend-request-already-pending.exception";
import { FriendRequestNotFoundException } from "../../../domain/exceptions/friend-request-not-found.exception";
import type { IFriendRequestRepository } from "../../../domain/repositories/friend-request.repository";
import type {
  FriendRequestStatus,
  RelationshipStatus,
} from "../../../domain/types/relationship-status.type";
import { FriendRequestValidationUtils } from "../../../domain/utils/friend-request-validation.utils";
import { FriendRequestPrismaMapper } from "../../mappers/friend-request-prisma.mapper";

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
} as const;

const latestBetweenUsersOrderBy = [
  { createdAt: "desc" as const },
  { id: "desc" as const },
];

export class PrismaFriendRequestRepository implements IFriendRequestRepository {
  async findById(id: number): Promise<FriendRequestEntity | null> {
    FriendRequestValidationUtils.assertValidFriendRequestId(id);

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

    const where = PrismaFriendRequestRepository.buildPairWhere(
      firstUserId,
      secondUserId,
    );
    const row = await prisma.friendRequest.findFirst({
      where,
      orderBy: latestBetweenUsersOrderBy,
    });

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

  async executeSendFriendRequest(
    requesterId: number,
    addresseeId: number,
  ): Promise<FriendRequestEntity> {
    FriendRequestValidationUtils.assertNotSelf(requesterId, addresseeId);

    const lockUserA = Math.min(requesterId, addresseeId);
    const lockUserB = Math.max(requesterId, addresseeId);

    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockUserA}::int, ${lockUserB}::int)`;

      const where = PrismaFriendRequestRepository.buildPairWhere(
        requesterId,
        addresseeId,
      );
      const latestRow = await tx.friendRequest.findFirst({
        where,
        orderBy: latestBetweenUsersOrderBy,
      });

      if (!latestRow) {
        const createdRow = await tx.friendRequest.create({
          data: {
            requesterId,
            addresseeId,
            status: "pending",
          },
        });

        return FriendRequestPrismaMapper.toEntity(createdRow);
      }

      const latest = FriendRequestPrismaMapper.toEntity(latestRow);

      if (latest.status === "accepted") {
        throw new AlreadyFriendsException();
      }

      if (latest.status === "pending") {
        const isOutgoingFromRequester = latest.requesterId === requesterId;

        if (isOutgoingFromRequester) {
          throw new FriendRequestAlreadyPendingException();
        }

        const prismaStatus = FriendRequestPrismaMapper.toPrismaStatus("accepted");
        const acceptedRow = await tx.friendRequest.update({
          where: { id: latest.id },
          data: { status: prismaStatus },
        });

        return FriendRequestPrismaMapper.toEntity(acceptedRow);
      }

      const createdRow = await tx.friendRequest.create({
        data: {
          requesterId,
          addresseeId,
          status: "pending",
        },
      });

      return FriendRequestPrismaMapper.toEntity(createdRow);
    });

    Logger.info("Friend request sent", {
      friendRequestId: result.id,
      requesterId,
      addresseeId,
      status: result.status,
    });

    return result;
  }

  async updateStatus(
    id: number,
    status: FriendRequestStatus,
  ): Promise<FriendRequestEntity> {
    FriendRequestValidationUtils.assertValidFriendRequestId(id);

    const prismaStatus = FriendRequestPrismaMapper.toPrismaStatus(status);

    try {
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
    } catch (error) {
      const notFoundException = new FriendRequestNotFoundException(id);
      PrismaErrorMapper.mapRecordNotFoundOrRethrow(error, notFoundException);
    }
  }

  async deleteById(id: number): Promise<void> {
    FriendRequestValidationUtils.assertValidFriendRequestId(id);

    try {
      await prisma.friendRequest.delete({ where: { id } });

      Logger.info("Friend request deleted", { friendRequestId: id });
    } catch (error) {
      const notFoundException = new FriendRequestNotFoundException(id);
      PrismaErrorMapper.mapRecordNotFoundOrRethrow(error, notFoundException);
    }
  }

  async deleteAllBetweenUsers(
    firstUserId: number,
    secondUserId: number,
  ): Promise<void> {
    FriendRequestValidationUtils.assertValidUserId(firstUserId);
    FriendRequestValidationUtils.assertValidUserId(secondUserId);

    const where = PrismaFriendRequestRepository.buildPairWhere(
      firstUserId,
      secondUserId,
    );
    const result = await prisma.friendRequest.deleteMany({ where });

    Logger.info("Friend request history cleared between users", {
      firstUserId,
      secondUserId,
      deletedCount: result.count,
    });
  }

  async listAcceptedFriends(userId: number): Promise<UserPublicEntity[]> {
    FriendRequestValidationUtils.assertValidUserId(userId);

    const where = {
      status: "accepted" as const,
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    };
    const rows = await prisma.friendRequest.findMany({
      where,
      include: {
        requester: { select: userPublicSelect },
        addressee: { select: userPublicSelect },
      },
    });

    const friendsById = new Map<number, UserPublicEntity>();

    for (const row of rows) {
      const isRequester = row.requesterId === userId;
      const friendUser = isRequester ? row.addressee : row.requester;
      const friend = FriendRequestPrismaMapper.toUserPublic(friendUser);
      friendsById.set(friend.id, friend);
    }

    const friends = Array.from(friendsById.values());
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
    const orderBy = { createdAt: "desc" as const };
    const rows = await prisma.friendRequest.findMany({
      where,
      include: { requester: { select: userPublicSelect } },
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
    const orderBy = { createdAt: "desc" as const };
    const rows = await prisma.friendRequest.findMany({
      where,
      include: { addressee: { select: userPublicSelect } },
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

  private static buildPairWhere(firstUserId: number, secondUserId: number) {
    return {
      OR: [
        { requesterId: firstUserId, addresseeId: secondUserId },
        { requesterId: secondUserId, addresseeId: firstUserId },
      ],
    };
  }
}
