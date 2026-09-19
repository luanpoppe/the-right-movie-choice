import type {
  CreateGroupChatInput,
  GroupChatEntity,
} from "../entities/group-chat.entity";

export interface IGroupChatRepository {
  create(input: CreateGroupChatInput): Promise<GroupChatEntity>;

  findById(
    groupId: number,
    id: number,
  ): Promise<GroupChatEntity | null>;

  findByChatId(
    groupId: number,
    chatId: string,
  ): Promise<GroupChatEntity | null>;

  listByGroupId(groupId: number): Promise<GroupChatEntity[]>;

  updateTitle(
    groupId: number,
    id: number,
    title: string,
  ): Promise<GroupChatEntity | null>;

  updateFilterMembers(
    groupId: number,
    id: number,
    filterMemberUserIds: number[],
  ): Promise<GroupChatEntity | null>;

  touchUpdatedAt(
    groupId: number,
    chatId: string,
  ): Promise<GroupChatEntity | null>;

  deleteById(groupId: number, id: number): Promise<boolean>;
}
