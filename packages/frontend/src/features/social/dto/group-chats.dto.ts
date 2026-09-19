import z from "zod";
import { ChatHistoryEntitySchema } from "@/features/conversations/dto/user-conversation.dto";
import { MovieRecommendationResponseDTOSchema } from "@/features/movies/dto/movie-recommendation.dto";

export class GroupChatConstants {
  static readonly MAX_TITLE_LENGTH = 200;
}

const groupChatTitleSchema = z.string().max(GroupChatConstants.MAX_TITLE_LENGTH);

export const GroupChatGroupIdParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
});

export type GroupChatGroupIdParams = z.infer<typeof GroupChatGroupIdParamsSchema>;

export const GroupChatChatIdParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
  chatId: z.uuid(),
});

export type GroupChatChatIdParams = z.infer<typeof GroupChatChatIdParamsSchema>;

export const GroupChatNumericIdParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
  id: z.coerce.number().int().positive(),
});

export type GroupChatNumericIdParams = z.infer<
  typeof GroupChatNumericIdParamsSchema
>;

export const CreateGroupChatDTOSchema = z
  .object({
    title: groupChatTitleSchema.optional(),
  })
  .strict();

export type CreateGroupChatDTO = z.infer<typeof CreateGroupChatDTOSchema>;

export const UpdateGroupChatTitleDTOSchema = z
  .object({
    title: groupChatTitleSchema,
  })
  .strict();

export type UpdateGroupChatTitleDTO = z.infer<
  typeof UpdateGroupChatTitleDTOSchema
>;

export const UpdateGroupChatFilterMembersDTOSchema = z
  .object({
    userIds: z.array(z.int().positive()),
  })
  .strict();

export type UpdateGroupChatFilterMembersDTO = z.infer<
  typeof UpdateGroupChatFilterMembersDTOSchema
>;

export const GroupChatRecommendationRequestDTOSchema = z
  .object({
    query: z.string().trim().min(1, "query is required"),
  })
  .strict();

export type GroupChatRecommendationRequestDTO = z.infer<
  typeof GroupChatRecommendationRequestDTOSchema
>;

export const GroupChatSummarySchema = z.object({
  id: z.int().positive(),
  groupId: z.int().positive(),
  chatId: z.uuid(),
  title: z.union([z.null(), z.string()]),
  filterMemberUserIds: z.array(z.int().positive()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GroupChatSummaryResponse = z.infer<typeof GroupChatSummarySchema>;

export const GroupChatCreateResponseSchema = GroupChatSummarySchema;

export type GroupChatCreateResponse = z.infer<
  typeof GroupChatCreateResponseSchema
>;

export const GroupChatListResponseSchema = z.array(GroupChatSummarySchema);

export type GroupChatListResponse = z.infer<typeof GroupChatListResponseSchema>;

export const GroupChatGetResponseSchema = GroupChatSummarySchema.extend({
  messages: ChatHistoryEntitySchema,
});

export type GroupChatGetResponse = z.infer<typeof GroupChatGetResponseSchema>;

export const GroupChatUpdateTitleResponseSchema = GroupChatSummarySchema;

export type GroupChatUpdateTitleResponse = z.infer<
  typeof GroupChatUpdateTitleResponseSchema
>;

export const GroupChatUpdateFilterMembersResponseSchema =
  GroupChatSummarySchema;

export type GroupChatUpdateFilterMembersResponse = z.infer<
  typeof GroupChatUpdateFilterMembersResponseSchema
>;

export const GroupChatRecommendationResponseSchema =
  MovieRecommendationResponseDTOSchema;

export type GroupChatRecommendationResponse = z.infer<
  typeof GroupChatRecommendationResponseSchema
>;

export const GroupChatInvalidFilterMemberUserIdsResponseSchema = z.object({
  error: z.string(),
  invalidUserIds: z.array(z.int().positive()),
});

export type GroupChatInvalidFilterMemberUserIdsResponse = z.infer<
  typeof GroupChatInvalidFilterMemberUserIdsResponseSchema
>;
