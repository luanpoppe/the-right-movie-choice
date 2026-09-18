import z from "zod";

export const UserPublicSchema = z.object({
  id: z.int().positive(),
  name: z.string(),
  email: z.string(),
});

export type UserPublicResponse = z.infer<typeof UserPublicSchema>;

export const FriendRequestStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
]);

export const RelationshipStatusSchema = z.enum([
  "none",
  "friends",
  "pending_outgoing",
  "pending_incoming",
  "rejected",
]);

export const FriendRequestResponseSchema = z.object({
  id: z.int().positive(),
  requesterId: z.int().positive(),
  addresseeId: z.int().positive(),
  status: FriendRequestStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FriendRequestResponse = z.infer<typeof FriendRequestResponseSchema>;

export const ListFriendsResponseSchema = z.array(UserPublicSchema);

export type ListFriendsResponse = z.infer<typeof ListFriendsResponseSchema>;

export const IncomingFriendRequestResponseSchema = z.object({
  id: z.int().positive(),
  requester: UserPublicSchema,
  status: FriendRequestStatusSchema,
  createdAt: z.string(),
});

export type IncomingFriendRequestResponse = z.infer<
  typeof IncomingFriendRequestResponseSchema
>;

export const ListIncomingFriendRequestsResponseSchema = z.array(
  IncomingFriendRequestResponseSchema,
);

export type ListIncomingFriendRequestsResponse = z.infer<
  typeof ListIncomingFriendRequestsResponseSchema
>;

export const OutgoingFriendRequestResponseSchema = z.object({
  id: z.int().positive(),
  addressee: UserPublicSchema,
  status: FriendRequestStatusSchema,
  createdAt: z.string(),
});

export type OutgoingFriendRequestResponse = z.infer<
  typeof OutgoingFriendRequestResponseSchema
>;

export const ListOutgoingFriendRequestsResponseSchema = z.array(
  OutgoingFriendRequestResponseSchema,
);

export type ListOutgoingFriendRequestsResponse = z.infer<
  typeof ListOutgoingFriendRequestsResponseSchema
>;

export const SearchUserByEmailResponseSchema = z.object({
  id: z.int().positive(),
  name: z.string(),
  email: z.string(),
  relationshipStatus: RelationshipStatusSchema,
});

export type SearchUserByEmailResponse = z.infer<
  typeof SearchUserByEmailResponseSchema
>;
