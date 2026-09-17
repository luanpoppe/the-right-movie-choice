export type UserConversationEntity = {
  id: number;
  userId: number;
  chatId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserConversationInput = {
  userId: number;
  chatId: string;
  title?: string | null;
};
