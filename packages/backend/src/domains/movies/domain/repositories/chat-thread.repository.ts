export interface IChatThreadRepository {
  deleteThread(chatId: string): Promise<void>;
}
