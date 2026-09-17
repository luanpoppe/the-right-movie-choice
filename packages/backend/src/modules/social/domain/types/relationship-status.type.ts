export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export type RelationshipStatus =
  | "none"
  | "friends"
  | "pending_outgoing"
  | "pending_incoming"
  | "rejected";
