import z from "zod";

export const ChatHistoryEntityTupleBase = z.tuple([
  z.enum(["user", "system", "ai"]),
  z.string(),
]);

export const ChatHistoryEntityTupleWithMovies = z.tuple([
  z.enum(["ai"]),
  z.string(),
  z.array(z.record(z.string(), z.unknown())),
]);

export const ChatHistoryEntityTuple = z.union([
  ChatHistoryEntityTupleBase,
  ChatHistoryEntityTupleWithMovies,
]);

export const ChatHistoryEntitySchema = z.array(ChatHistoryEntityTuple);

export type ChatHistoryEntity = z.infer<typeof ChatHistoryEntitySchema>;
