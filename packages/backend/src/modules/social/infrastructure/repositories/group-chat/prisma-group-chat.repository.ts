import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { PrismaErrorMapper } from "@/shared/mappers/prisma-error.mapper";
import type {
  CreateGroupChatInput,
  GroupChatEntity,
} from "../../../domain/entities/group-chat.entity";
import { GroupChatValidationException } from "../../../domain/exceptions/group-chat-validation.exception";
import type { IGroupChatRepository } from "../../../domain/repositories/group-chat.repository";
import { GroupChatValidationUtils } from "../../../domain/group-chat-validation.utils";
import { GroupChatPrismaMapper } from "../../mappers/group-chat-prisma.mapper";

export class PrismaGroupChatRepository implements IGroupChatRepository {
  async create(input: CreateGroupChatInput): Promise<GroupChatEntity> {
    GroupChatValidationUtils.assertValidCreateInput(input);

    let row;
    try {
      row = await prisma.groupChat.create({
        data: {
          groupId: input.groupId,
          chatId: input.chatId,
          title: input.title ?? null,
          filterMemberUserIds: input.filterMemberUserIds,
        },
      });
    } catch (error) {
      const chatId = input.chatId;
      const conflictException = new GroupChatValidationException(
        `chatId already exists: ${chatId}`,
      );
      PrismaErrorMapper.mapUniqueViolationOrRethrow(error, conflictException);
    }

    Logger.info("Group chat created", {
      groupId: input.groupId,
      chatId: input.chatId,
      groupChatId: row.id,
    });

    const entity = GroupChatPrismaMapper.toEntity(row);
    return entity;
  }

  async findById(
    groupId: number,
    id: number,
  ): Promise<GroupChatEntity | null> {
    GroupChatValidationUtils.assertValidGroupId(groupId);
    GroupChatValidationUtils.assertValidId(id);

    const where = { id, groupId };
    const row = await prisma.groupChat.findFirst({ where });

    if (!row) {
      Logger.debug("Group chat find by id miss", { groupId, id });
      return null;
    }

    Logger.debug("Group chat find by id hit", { groupId, id });
    const entity = GroupChatPrismaMapper.toEntity(row);
    return entity;
  }

  async findByChatId(
    groupId: number,
    chatId: string,
  ): Promise<GroupChatEntity | null> {
    GroupChatValidationUtils.assertValidGroupId(groupId);
    GroupChatValidationUtils.assertValidChatId(chatId);

    const where = { chatId, groupId };
    const row = await prisma.groupChat.findFirst({ where });

    if (!row) {
      Logger.debug("Group chat find by chatId miss", { groupId, chatId });
      return null;
    }

    Logger.debug("Group chat find by chatId hit", { groupId, chatId });
    const entity = GroupChatPrismaMapper.toEntity(row);
    return entity;
  }

  async listByGroupId(groupId: number): Promise<GroupChatEntity[]> {
    GroupChatValidationUtils.assertValidGroupId(groupId);

    const rows = await prisma.groupChat.findMany({
      where: { groupId },
      orderBy: { updatedAt: "desc" },
    });

    Logger.debug("Group chat list", { groupId, count: rows.length });

    const entities = rows.map((row) => GroupChatPrismaMapper.toEntity(row));
    return entities;
  }

  async updateTitle(
    groupId: number,
    id: number,
    title: string,
  ): Promise<GroupChatEntity | null> {
    GroupChatValidationUtils.assertValidGroupId(groupId);
    GroupChatValidationUtils.assertValidId(id);
    GroupChatValidationUtils.assertValidTitle(title);

    const updateWhere = { id, groupId };
    const updateResult = await prisma.groupChat.updateMany({
      where: updateWhere,
      data: { title },
    });

    const wasUpdated = updateResult.count > 0;
    if (!wasUpdated) {
      Logger.debug("Group chat update title miss", { groupId, id });
      return null;
    }

    const row = await prisma.groupChat.findFirst({
      where: updateWhere,
    });

    if (!row) {
      Logger.debug("Group chat update title miss after update", { groupId, id });
      return null;
    }

    Logger.info("Group chat title updated", {
      groupId,
      groupChatId: id,
    });

    const entity = GroupChatPrismaMapper.toEntity(row);
    return entity;
  }

  async updateFilterMembers(
    groupId: number,
    id: number,
    filterMemberUserIds: number[],
  ): Promise<GroupChatEntity | null> {
    GroupChatValidationUtils.assertValidGroupId(groupId);
    GroupChatValidationUtils.assertValidId(id);
    GroupChatValidationUtils.assertValidFilterMemberUserIds(filterMemberUserIds);

    const updateWhere = { id, groupId };
    const updateResult = await prisma.groupChat.updateMany({
      where: updateWhere,
      data: { filterMemberUserIds },
    });

    const wasUpdated = updateResult.count > 0;
    if (!wasUpdated) {
      Logger.debug("Group chat update filter members miss", { groupId, id });
      return null;
    }

    const row = await prisma.groupChat.findFirst({
      where: updateWhere,
    });

    if (!row) {
      Logger.debug("Group chat update filter members miss after update", {
        groupId,
        id,
      });
      return null;
    }

    Logger.info("Group chat filter members updated", {
      groupId,
      groupChatId: id,
      memberCount: filterMemberUserIds.length,
    });

    const entity = GroupChatPrismaMapper.toEntity(row);
    return entity;
  }

  async touchUpdatedAt(
    groupId: number,
    chatId: string,
  ): Promise<GroupChatEntity | null> {
    GroupChatValidationUtils.assertValidGroupId(groupId);
    GroupChatValidationUtils.assertValidChatId(chatId);

    const updateWhere = { chatId, groupId };
    const updatedAt = new Date();
    const updateResult = await prisma.groupChat.updateMany({
      where: updateWhere,
      data: { updatedAt },
    });

    const wasUpdated = updateResult.count > 0;
    if (!wasUpdated) {
      Logger.debug("Group chat touch updatedAt miss", { groupId, chatId });
      return null;
    }

    const row = await prisma.groupChat.findFirst({
      where: updateWhere,
    });

    if (!row) {
      Logger.debug("Group chat touch updatedAt miss after update", {
        groupId,
        chatId,
      });
      return null;
    }

    Logger.info("Group chat updatedAt touched", {
      groupId,
      chatId,
      groupChatId: row.id,
    });

    const entity = GroupChatPrismaMapper.toEntity(row);
    return entity;
  }

  async deleteById(groupId: number, id: number): Promise<boolean> {
    GroupChatValidationUtils.assertValidGroupId(groupId);
    GroupChatValidationUtils.assertValidId(id);

    const deleteResult = await prisma.groupChat.deleteMany({
      where: { id, groupId },
    });

    const wasDeleted = deleteResult.count > 0;

    if (wasDeleted) {
      Logger.info("Group chat deleted", { groupId, groupChatId: id });
      return true;
    }

    Logger.debug("Group chat delete miss", { groupId, id });
    return false;
  }
}
