import z from "zod";

export class UserConversationConstants {
  static readonly MAX_TITLE_LENGTH = 200;
}

export const ChatHistoryEntityTuple = z.tuple([
  z.enum(["user", "system", "ai"]),
  z.string(),
]);

export const ChatHistoryEntitySchema = z.array(ChatHistoryEntityTuple);

export type ChatHistoryEntity = z.infer<typeof ChatHistoryEntitySchema>;

export const UserConversationIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type UserConversationIdParams = z.infer<
  typeof UserConversationIdParamsSchema
>;

export const UserConversationPatchDTOSchema = z
  .object({
    title: z.string().max(UserConversationConstants.MAX_TITLE_LENGTH),
  })
  .strict();

export type UserConversationPatchDTO = z.infer<
  typeof UserConversationPatchDTOSchema
>;

export const UserConversationSummarySchema = z.object({
  id: z.int().positive(),
  chatId: z.uuid(),
  title: z.union([z.null(), z.string()]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserConversationSummaryResponse = z.infer<
  typeof UserConversationSummarySchema
>;

export const UserConversationCreateResponseDTOSchema =
  UserConversationSummarySchema;

export type UserConversationCreateResponseDTO = z.infer<
  typeof UserConversationCreateResponseDTOSchema
>;

export const UserConversationListResponseDTOSchema = z.array(
  UserConversationSummarySchema,
);

export type UserConversationListResponseDTO = z.infer<
  typeof UserConversationListResponseDTOSchema
>;

export const UserConversationGetResponseDTOSchema =
  UserConversationSummarySchema.extend({
    messages: ChatHistoryEntitySchema,
  });

export type UserConversationGetResponseDTO = z.infer<
  typeof UserConversationGetResponseDTOSchema
>;

export const UserConversationPatchResponseDTOSchema =
  UserConversationSummarySchema;

export type UserConversationPatchResponseDTO = z.infer<
  typeof UserConversationPatchResponseDTOSchema
>;
