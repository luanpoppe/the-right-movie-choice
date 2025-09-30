import z from "zod";

export const ChatHistoryEntityTuple = z.tuple([
  z.enum(["user", "system", "ai"]),
  z.string(),
]);

export const ChatHistoryEntitySchema = z.array(ChatHistoryEntityTuple);

export type ChatHistoryEntityType = z.infer<typeof ChatHistoryEntitySchema>;

export type ChatHistoryEntity = {
  // chatHistory: BaseMessagePromptTemplateLike[];
  chatHistory: ChatHistoryEntityType;
};
