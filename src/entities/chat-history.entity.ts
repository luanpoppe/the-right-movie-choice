import z from "zod";

export const ChatHistoryEntityTuple = z.tuple([
  z.enum(["user", "system", "ai"]),
  z.string(),
]);

export const ChatHistoryEntitySchema = z.array(ChatHistoryEntityTuple);

export type ChatHistoryEntity = z.infer<typeof ChatHistoryEntitySchema>;
