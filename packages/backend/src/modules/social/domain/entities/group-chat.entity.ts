export type GroupChatEntity = {
  id: number;
  groupId: number;
  chatId: string;
  title: string | null;
  filterMemberUserIds: number[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreateGroupChatInput = {
  groupId: number;
  chatId: string;
  title?: string | null;
  filterMemberUserIds: number[];
};
