import type {
  CreateUserConversationInput,
  UserConversationEntity,
} from "../entities/user-conversation.entity";

export interface IUserConversationRepository {
  create(input: CreateUserConversationInput): Promise<UserConversationEntity>;

  findById(
    userId: number,
    id: number,
  ): Promise<UserConversationEntity | null>;

  findByChatId(
    userId: number,
    chatId: string,
  ): Promise<UserConversationEntity | null>;

  listByUserId(userId: number): Promise<UserConversationEntity[]>;

  updateTitle(
    userId: number,
    id: number,
    title: string,
  ): Promise<UserConversationEntity | null>;

  touchUpdatedAt(
    userId: number,
    chatId: string,
  ): Promise<UserConversationEntity | null>;

  deleteById(userId: number, id: number): Promise<boolean>;
}
