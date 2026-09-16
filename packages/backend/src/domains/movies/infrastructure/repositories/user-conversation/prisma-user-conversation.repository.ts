import { prisma } from "@/lib/prisma/prisma";
import { Logger } from "@/lib/logger/logger";
import { PrismaErrorMapper } from "@/shared/mappers/prisma-error.mapper";
import type {
  CreateUserConversationInput,
  UserConversationEntity,
} from "../../../domain/entities/user-conversation.entity";
import { UserConversationChatIdConflictException } from "../../../domain/exceptions/user-conversation-chat-id-conflict.exception";
import type { IUserConversationRepository } from "../../../domain/repositories/user-conversation.repository";
import { UserConversationValidationUtils } from "../../../domain/user-conversation-validation.utils";
import { UserConversationPrismaMapper } from "../../mappers/user-conversation-prisma.mapper";

export class PrismaUserConversationRepository
  implements IUserConversationRepository
{
  async create(
    input: CreateUserConversationInput,
  ): Promise<UserConversationEntity> {
    UserConversationValidationUtils.assertValidCreateInput(
      input.userId,
      input.chatId,
    );

    const hasTitle = input.title != null;
    if (hasTitle) {
      UserConversationValidationUtils.assertValidTitle(input.title as string);
    }

    let row;
    try {
      row = await prisma.userConversation.create({
        data: {
          userId: input.userId,
          chatId: input.chatId,
          title: input.title ?? null,
        },
      });
    } catch (error) {
      const conflictException = new UserConversationChatIdConflictException(
        input.chatId,
      );
      PrismaErrorMapper.mapUniqueViolationOrRethrow(error, conflictException);
    }

    Logger.info("User conversation created", {
      userId: input.userId,
      chatId: input.chatId,
      conversationId: row.id,
    });

    const entity = UserConversationPrismaMapper.toEntity(row);
    return entity;
  }

  async findById(
    userId: number,
    id: number,
  ): Promise<UserConversationEntity | null> {
    UserConversationValidationUtils.assertValidUserId(userId);

    const where = { id, userId };
    const row = await prisma.userConversation.findFirst({ where });

    if (!row) {
      Logger.debug("User conversation find by id miss", { userId, id });
      return null;
    }

    Logger.debug("User conversation find by id hit", { userId, id });
    const entity = UserConversationPrismaMapper.toEntity(row);
    return entity;
  }

  async findByChatId(
    userId: number,
    chatId: string,
  ): Promise<UserConversationEntity | null> {
    UserConversationValidationUtils.assertValidUserId(userId);
    UserConversationValidationUtils.assertValidChatId(chatId);

    const where = { chatId, userId };
    const row = await prisma.userConversation.findFirst({ where });

    if (!row) {
      Logger.debug("User conversation find by chatId miss", { userId, chatId });
      return null;
    }

    Logger.debug("User conversation find by chatId hit", { userId, chatId });
    const entity = UserConversationPrismaMapper.toEntity(row);
    return entity;
  }

  async listByUserId(userId: number): Promise<UserConversationEntity[]> {
    UserConversationValidationUtils.assertValidUserId(userId);

    const rows = await prisma.userConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    Logger.debug("User conversation list", { userId, count: rows.length });

    const entities = rows.map((row) =>
      UserConversationPrismaMapper.toEntity(row),
    );
    return entities;
  }

  async updateTitle(
    userId: number,
    id: number,
    title: string,
  ): Promise<UserConversationEntity | null> {
    UserConversationValidationUtils.assertValidUserId(userId);
    UserConversationValidationUtils.assertValidTitle(title);

    const updateWhere = { id, userId };
    const updateResult = await prisma.userConversation.updateMany({
      where: updateWhere,
      data: { title },
    });

    const wasUpdated = updateResult.count > 0;
    if (!wasUpdated) {
      Logger.debug("User conversation update title miss", { userId, id });
      return null;
    }

    const row = await prisma.userConversation.findFirst({
      where: updateWhere,
    });

    if (!row) {
      Logger.debug("User conversation update title miss after update", {
        userId,
        id,
      });
      return null;
    }

    Logger.info("User conversation title updated", {
      userId,
      conversationId: id,
    });

    const entity = UserConversationPrismaMapper.toEntity(row);
    return entity;
  }

  async deleteById(userId: number, id: number): Promise<boolean> {
    UserConversationValidationUtils.assertValidUserId(userId);

    const deleteResult = await prisma.userConversation.deleteMany({
      where: { id, userId },
    });

    const wasDeleted = deleteResult.count > 0;

    if (wasDeleted) {
      Logger.info("User conversation deleted", { userId, conversationId: id });
      return true;
    }

    Logger.debug("User conversation delete miss", { userId, id });
    return false;
  }
}
