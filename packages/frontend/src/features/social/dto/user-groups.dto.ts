import z from "zod";
import { UserPublicSchema } from "./friendship.dto";

export class UserGroupConstants {
  static readonly MAX_GROUP_NAME_LENGTH = 100;
  static readonly MAX_GROUP_DESCRIPTION_LENGTH = 500;
}

const emailSchema = z
  .string()
  .trim()
  .min(1, "email is required")
  .email("invalid email");

const groupNameSchema = z
  .string()
  .trim()
  .min(1, "name is required")
  .max(UserGroupConstants.MAX_GROUP_NAME_LENGTH);

const groupDescriptionSchema = z
  .string()
  .max(UserGroupConstants.MAX_GROUP_DESCRIPTION_LENGTH);

export const CreateUserGroupDTOSchema = z
  .object({
    name: groupNameSchema,
    description: groupDescriptionSchema.optional(),
  })
  .strict();

export type CreateUserGroupDTO = z.infer<typeof CreateUserGroupDTOSchema>;

export const UpdateUserGroupDTOSchema = z
  .object({
    name: groupNameSchema.optional(),
    description: groupDescriptionSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (data) => data.name !== undefined || data.description !== undefined,
    {
      message: "patch must contain at least one field to update",
    },
  );

export type UpdateUserGroupDTO = z.infer<typeof UpdateUserGroupDTOSchema>;

export const SendGroupInviteDTOSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export type SendGroupInviteDTO = z.infer<typeof SendGroupInviteDTOSchema>;

export const UserGroupIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type UserGroupIdParams = z.infer<typeof UserGroupIdParamsSchema>;

export const GroupMemberUserIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
});

export type GroupMemberUserIdParams = z.infer<
  typeof GroupMemberUserIdParamsSchema
>;

export const GroupInviteIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type GroupInviteIdParams = z.infer<typeof GroupInviteIdParamsSchema>;

export const GroupInviteStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
]);

export const UserGroupResponseSchema = z.object({
  id: z.int().positive(),
  name: z.string(),
  description: z.string().optional(),
  ownerId: z.int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserGroupResponse = z.infer<typeof UserGroupResponseSchema>;

export const UserGroupListItemResponseSchema = z.object({
  id: z.int().positive(),
  name: z.string(),
  description: z.string().optional(),
  ownerId: z.int().positive(),
  memberCount: z.int().nonnegative(),
  joinedAt: z.string(),
});

export type UserGroupListItemResponse = z.infer<
  typeof UserGroupListItemResponseSchema
>;

export const ListUserGroupsResponseSchema = z.array(
  UserGroupListItemResponseSchema,
);

export type ListUserGroupsResponse = z.infer<
  typeof ListUserGroupsResponseSchema
>;

export const GroupInviteResponseSchema = z.object({
  id: z.int().positive(),
  groupId: z.int().positive(),
  inviterId: z.int().positive(),
  inviteeId: z.int().positive(),
  status: GroupInviteStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GroupInviteResponse = z.infer<typeof GroupInviteResponseSchema>;

export const GroupFriendSuggestionSchema = z.object({
  id: z.int().positive(),
  name: z.string(),
  email: z.string(),
});

export type GroupFriendSuggestionResponse = z.infer<
  typeof GroupFriendSuggestionSchema
>;

export const ListGroupFriendSuggestionsResponseSchema = z.array(
  GroupFriendSuggestionSchema,
);

export type ListGroupFriendSuggestionsResponse = z.infer<
  typeof ListGroupFriendSuggestionsResponseSchema
>;

export const IncomingGroupInviteGroupSchema = z.object({
  id: z.int().positive(),
  name: z.string(),
});

export const IncomingGroupInviteInviterSchema = z.object({
  id: z.int().positive(),
  name: z.string(),
  email: z.string(),
});

export const IncomingGroupInviteResponseSchema = z.object({
  id: z.int().positive(),
  group: IncomingGroupInviteGroupSchema,
  inviter: IncomingGroupInviteInviterSchema,
  status: GroupInviteStatusSchema,
  createdAt: z.string(),
});

export type IncomingGroupInviteResponse = z.infer<
  typeof IncomingGroupInviteResponseSchema
>;

export const ListIncomingGroupInvitesResponseSchema = z.array(
  IncomingGroupInviteResponseSchema,
);

export type ListIncomingGroupInvitesResponse = z.infer<
  typeof ListIncomingGroupInvitesResponseSchema
>;

export const ListGroupMembersResponseSchema = z.array(UserPublicSchema);

export type ListGroupMembersResponse = z.infer<
  typeof ListGroupMembersResponseSchema
>;
