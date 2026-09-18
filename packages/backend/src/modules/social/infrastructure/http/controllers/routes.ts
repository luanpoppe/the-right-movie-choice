import { FastifyInstance } from "fastify";
import {
  AcceptFriendRequestDocs,
  CancelFriendRequestDocs,
  ListFriendsDocs,
  ListIncomingFriendRequestsDocs,
  ListOutgoingFriendRequestsDocs,
  RejectFriendRequestDocs,
  RemoveFriendDocs,
  SearchUserByEmailDocs,
  SendFriendRequestDocs,
} from "../docs/friendship.docs";
import { MakeFriendshipHttpFactory } from "../../factories/make-friendship-http.factory";
import { MakeUserGroupsHttpFactory } from "../../factories/make-user-groups-http.factory";
import {
  AcceptGroupInviteDocs,
  CancelGroupInviteDocs,
  CreateUserGroupDocs,
  DeleteUserGroupDocs,
  LeaveUserGroupDocs,
  ListGroupMembersDocs,
  ListIncomingGroupInvitesDocs,
  ListUserGroupsDocs,
  RejectGroupInviteDocs,
  RemoveGroupMemberDocs,
  SendGroupInviteDocs,
  SuggestGroupFriendsDocs,
  UpdateUserGroupDocs,
} from "../docs/user-groups.docs";

export async function socialControllers(app: FastifyInstance) {
  const friendshipHttp = MakeFriendshipHttpFactory.create();
  const userGroupsHttp = MakeUserGroupsHttpFactory.create();

  app.post(
    "/social/friend-requests",
    {
      ...SendFriendRequestDocs,
      preHandler: friendshipHttp.preHandler,
    } as any,
    friendshipHttp.handlers.sendFriendRequest,
  );

  app.post(
    "/social/friend-requests/:id/accept",
    {
      ...AcceptFriendRequestDocs,
      preHandler: friendshipHttp.preHandler,
    } as any,
    friendshipHttp.handlers.acceptFriendRequest,
  );

  app.post(
    "/social/friend-requests/:id/reject",
    {
      ...RejectFriendRequestDocs,
      preHandler: friendshipHttp.preHandler,
    } as any,
    friendshipHttp.handlers.rejectFriendRequest,
  );

  app.delete(
    "/social/friend-requests/:id",
    {
      ...CancelFriendRequestDocs,
      preHandler: friendshipHttp.preHandler,
    } as any,
    friendshipHttp.handlers.cancelFriendRequest,
  );

  app.delete(
    "/social/friends/:userId",
    {
      ...RemoveFriendDocs,
      preHandler: friendshipHttp.preHandler,
    } as any,
    friendshipHttp.handlers.removeFriend,
  );

  app.get(
    "/social/friends",
    {
      ...ListFriendsDocs,
      preHandler: friendshipHttp.preHandler,
    } as any,
    friendshipHttp.handlers.listFriends,
  );

  app.get(
    "/social/friend-requests/incoming",
    {
      ...ListIncomingFriendRequestsDocs,
      preHandler: friendshipHttp.preHandler,
    } as any,
    friendshipHttp.handlers.listIncomingFriendRequests,
  );

  app.get(
    "/social/friend-requests/outgoing",
    {
      ...ListOutgoingFriendRequestsDocs,
      preHandler: friendshipHttp.preHandler,
    } as any,
    friendshipHttp.handlers.listOutgoingFriendRequests,
  );

  app.get(
    "/social/users/search",
    {
      ...SearchUserByEmailDocs,
      preHandler: friendshipHttp.preHandler,
    } as any,
    friendshipHttp.handlers.searchUserByEmail,
  );

  app.post(
    "/social/groups",
    {
      ...CreateUserGroupDocs,
      preHandler: userGroupsHttp.preHandler,
    } as any,
    userGroupsHttp.handlers.createUserGroup,
  );

  app.get(
    "/social/groups",
    {
      ...ListUserGroupsDocs,
      preHandler: userGroupsHttp.preHandler,
    } as any,
    userGroupsHttp.handlers.listUserGroups,
  );

  app.patch(
    "/social/groups/:id",
    {
      ...UpdateUserGroupDocs,
      preHandler: userGroupsHttp.preHandler,
    } as any,
    userGroupsHttp.handlers.updateUserGroup,
  );

  app.delete(
    "/social/groups/:id",
    {
      ...DeleteUserGroupDocs,
      preHandler: userGroupsHttp.preHandler,
    } as any,
    userGroupsHttp.handlers.deleteUserGroup,
  );

  app.post(
    "/social/groups/:id/invites",
    {
      ...SendGroupInviteDocs,
      preHandler: userGroupsHttp.preHandler,
    } as any,
    userGroupsHttp.handlers.sendGroupInvite,
  );

  app.delete(
    "/social/groups/:id/members/me",
    {
      ...LeaveUserGroupDocs,
      preHandler: userGroupsHttp.preHandler,
    } as any,
    userGroupsHttp.handlers.leaveUserGroup,
  );

  app.delete(
    "/social/groups/:id/members/:userId",
    {
      ...RemoveGroupMemberDocs,
      preHandler: userGroupsHttp.preHandler,
    } as any,
    userGroupsHttp.handlers.removeGroupMember,
  );

  app.get(
    "/social/groups/:id/members",
    {
      ...ListGroupMembersDocs,
      preHandler: userGroupsHttp.preHandler,
    } as any,
    userGroupsHttp.handlers.listGroupMembers,
  );

  app.get(
    "/social/groups/:id/suggestions",
    {
      ...SuggestGroupFriendsDocs,
      preHandler: userGroupsHttp.preHandler,
    } as any,
    userGroupsHttp.handlers.suggestGroupFriends,
  );

  app.get(
    "/social/group-invites/incoming",
    {
      ...ListIncomingGroupInvitesDocs,
      preHandler: userGroupsHttp.preHandler,
    } as any,
    userGroupsHttp.handlers.listIncomingGroupInvites,
  );

  app.post(
    "/social/group-invites/:id/accept",
    {
      ...AcceptGroupInviteDocs,
      preHandler: userGroupsHttp.preHandler,
    } as any,
    userGroupsHttp.handlers.acceptGroupInvite,
  );

  app.post(
    "/social/group-invites/:id/reject",
    {
      ...RejectGroupInviteDocs,
      preHandler: userGroupsHttp.preHandler,
    } as any,
    userGroupsHttp.handlers.rejectGroupInvite,
  );

  app.delete(
    "/social/group-invites/:id",
    {
      ...CancelGroupInviteDocs,
      preHandler: userGroupsHttp.preHandler,
    } as any,
    userGroupsHttp.handlers.cancelGroupInvite,
  );
}
