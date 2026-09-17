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

export async function socialControllers(app: FastifyInstance) {
  const friendshipHttp = MakeFriendshipHttpFactory.create();

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
}
