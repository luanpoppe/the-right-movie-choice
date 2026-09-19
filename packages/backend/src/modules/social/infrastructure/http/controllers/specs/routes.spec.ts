import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { FastifyInstance } from "fastify";

const friendshipPreHandler = vi.fn();
const friendshipHandlers = {
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  rejectFriendRequest: vi.fn(),
  cancelFriendRequest: vi.fn(),
  removeFriend: vi.fn(),
  listFriends: vi.fn(),
  listIncomingFriendRequests: vi.fn(),
  listOutgoingFriendRequests: vi.fn(),
  searchUserByEmail: vi.fn(),
};

const userGroupsPreHandler = vi.fn();
const userGroupsHandlers = {
  createUserGroup: vi.fn(),
  listUserGroups: vi.fn(),
  updateUserGroup: vi.fn(),
  deleteUserGroup: vi.fn(),
  sendGroupInvite: vi.fn(),
  leaveUserGroup: vi.fn(),
  removeGroupMember: vi.fn(),
  listGroupMembers: vi.fn(),
  suggestGroupFriends: vi.fn(),
  listIncomingGroupInvites: vi.fn(),
  acceptGroupInvite: vi.fn(),
  rejectGroupInvite: vi.fn(),
  cancelGroupInvite: vi.fn(),
};

const groupChatsPreHandler = vi.fn();
const groupChatsHandlers = {
  createGroupChat: vi.fn(),
  listGroupChats: vi.fn(),
  getGroupChat: vi.fn(),
  updateGroupChatTitle: vi.fn(),
  deleteGroupChat: vi.fn(),
  updateGroupChatFilterMembers: vi.fn(),
  recommendInGroupChat: vi.fn(),
};

vi.mock("../../../factories/make-friendship-http.factory", () => ({
  MakeFriendshipHttpFactory: {
    create: vi.fn(() => ({
      preHandler: friendshipPreHandler,
      handlers: friendshipHandlers,
    })),
  },
}));

vi.mock("../../../factories/make-user-groups-http.factory", () => ({
  MakeUserGroupsHttpFactory: {
    create: vi.fn(() => ({
      preHandler: userGroupsPreHandler,
      handlers: userGroupsHandlers,
    })),
  },
}));

vi.mock("../../../factories/make-group-chats-http.factory", () => ({
  MakeGroupChatsHttpFactory: {
    create: vi.fn(() => ({
      preHandler: groupChatsPreHandler,
      handlers: groupChatsHandlers,
    })),
  },
}));

import { MakeFriendshipHttpFactory } from "../../../factories/make-friendship-http.factory";
import { MakeGroupChatsHttpFactory } from "../../../factories/make-group-chats-http.factory";
import { MakeUserGroupsHttpFactory } from "../../../factories/make-user-groups-http.factory";
import { socialControllers } from "../routes";

describe("socialControllers routes", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    app = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as FastifyInstance;
  });

  it("registra POST /social/friend-requests com preHandler e handler", async () => {
    await socialControllers(app);

    expect(MakeFriendshipHttpFactory.create).toHaveBeenCalledTimes(1);
    expect(MakeUserGroupsHttpFactory.create).toHaveBeenCalledTimes(1);
    expect(MakeGroupChatsHttpFactory.create).toHaveBeenCalledTimes(1);

    expect(app.post).toHaveBeenCalledWith(
      "/social/friend-requests",
      expect.objectContaining({
        preHandler: friendshipPreHandler,
      }),
      friendshipHandlers.sendFriendRequest,
    );
  });

  it("registra rotas de accept/reject/cancel de friend-requests", async () => {
    await socialControllers(app);

    expect(app.post).toHaveBeenCalledWith(
      "/social/friend-requests/:id/accept",
      expect.objectContaining({
        preHandler: friendshipPreHandler,
      }),
      friendshipHandlers.acceptFriendRequest,
    );

    expect(app.post).toHaveBeenCalledWith(
      "/social/friend-requests/:id/reject",
      expect.objectContaining({
        preHandler: friendshipPreHandler,
      }),
      friendshipHandlers.rejectFriendRequest,
    );

    expect(app.delete).toHaveBeenCalledWith(
      "/social/friend-requests/:id",
      expect.objectContaining({
        preHandler: friendshipPreHandler,
      }),
      friendshipHandlers.cancelFriendRequest,
    );
  });

  it("registra rotas GET de friends e friend-requests", async () => {
    await socialControllers(app);

    expect(app.get).toHaveBeenCalledWith(
      "/social/friends",
      expect.objectContaining({
        preHandler: friendshipPreHandler,
      }),
      friendshipHandlers.listFriends,
    );

    expect(app.get).toHaveBeenCalledWith(
      "/social/friend-requests/incoming",
      expect.objectContaining({
        preHandler: friendshipPreHandler,
      }),
      friendshipHandlers.listIncomingFriendRequests,
    );

    expect(app.get).toHaveBeenCalledWith(
      "/social/friend-requests/outgoing",
      expect.objectContaining({
        preHandler: friendshipPreHandler,
      }),
      friendshipHandlers.listOutgoingFriendRequests,
    );
  });

  it("registra DELETE /social/friends/:userId e GET /social/users/search", async () => {
    await socialControllers(app);

    expect(app.delete).toHaveBeenCalledWith(
      "/social/friends/:userId",
      expect.objectContaining({
        preHandler: friendshipPreHandler,
      }),
      friendshipHandlers.removeFriend,
    );

    expect(app.get).toHaveBeenCalledWith(
      "/social/users/search",
      expect.objectContaining({
        preHandler: friendshipPreHandler,
      }),
      friendshipHandlers.searchUserByEmail,
    );
  });

  it("registra GET /social/groups/:id/members com preHandler e handler", async () => {
    await socialControllers(app);

    expect(app.get).toHaveBeenCalledWith(
      "/social/groups/:id/members",
      expect.objectContaining({
        preHandler: userGroupsPreHandler,
      }),
      userGroupsHandlers.listGroupMembers,
    );
  });

  it("registra rotas de group chats com preHandler e handlers", async () => {
    await socialControllers(app);

    expect(app.post).toHaveBeenCalledWith(
      "/social/groups/:groupId/chats",
      expect.objectContaining({
        preHandler: groupChatsPreHandler,
      }),
      groupChatsHandlers.createGroupChat,
    );

    expect(app.get).toHaveBeenCalledWith(
      "/social/groups/:groupId/chats",
      expect.objectContaining({
        preHandler: groupChatsPreHandler,
      }),
      groupChatsHandlers.listGroupChats,
    );

    expect(app.get).toHaveBeenCalledWith(
      "/social/groups/:groupId/chats/:chatId",
      expect.objectContaining({
        preHandler: groupChatsPreHandler,
      }),
      groupChatsHandlers.getGroupChat,
    );

    expect(app.patch).toHaveBeenCalledWith(
      "/social/groups/:groupId/chats/:id",
      expect.objectContaining({
        preHandler: groupChatsPreHandler,
      }),
      groupChatsHandlers.updateGroupChatTitle,
    );

    expect(app.delete).toHaveBeenCalledWith(
      "/social/groups/:groupId/chats/:id",
      expect.objectContaining({
        preHandler: groupChatsPreHandler,
      }),
      groupChatsHandlers.deleteGroupChat,
    );

    expect(app.patch).toHaveBeenCalledWith(
      "/social/groups/:groupId/chats/:id/filter-members",
      expect.objectContaining({
        preHandler: groupChatsPreHandler,
      }),
      groupChatsHandlers.updateGroupChatFilterMembers,
    );

    expect(app.post).toHaveBeenCalledWith(
      "/social/groups/:groupId/chats/:chatId/recommendation",
      expect.objectContaining({
        preHandler: groupChatsPreHandler,
      }),
      groupChatsHandlers.recommendInGroupChat,
    );
  });

  it("routes.ts referencia docs e factory de friendship no código-fonte", () => {
    const routesPath = path.join(
      process.cwd(),
      "src/modules/social/infrastructure/http/controllers/routes.ts",
    );
    const routesSource = readFileSync(routesPath, "utf8");

    expect(routesSource).toMatch(/MakeFriendshipHttpFactory\.create\(\)/);
    expect(routesSource).toMatch(/SendFriendRequestDocs/);
    expect(routesSource).toMatch(/AcceptFriendRequestDocs/);
    expect(routesSource).toMatch(/RejectFriendRequestDocs/);
    expect(routesSource).toMatch(/CancelFriendRequestDocs/);
    expect(routesSource).toMatch(/RemoveFriendDocs/);
    expect(routesSource).toMatch(/ListFriendsDocs/);
    expect(routesSource).toMatch(/ListIncomingFriendRequestsDocs/);
    expect(routesSource).toMatch(/ListOutgoingFriendRequestsDocs/);
    expect(routesSource).toMatch(/SearchUserByEmailDocs/);
    expect(routesSource).toMatch(/friendshipHttp\.preHandler/);
    expect(routesSource).toMatch(/friendshipHttp\.handlers\.sendFriendRequest/);
    expect(routesSource).toMatch(/friendshipHttp\.handlers\.acceptFriendRequest/);
    expect(routesSource).toMatch(/friendshipHttp\.handlers\.searchUserByEmail/);
    expect(routesSource).toMatch(/MakeGroupChatsHttpFactory\.create\(\)/);
    expect(routesSource).toMatch(/CreateGroupChatDocs/);
    expect(routesSource).toMatch(/ListGroupChatsDocs/);
    expect(routesSource).toMatch(/GetGroupChatDocs/);
    expect(routesSource).toMatch(/UpdateGroupChatTitleDocs/);
    expect(routesSource).toMatch(/DeleteGroupChatDocs/);
    expect(routesSource).toMatch(/UpdateGroupChatFilterMembersDocs/);
    expect(routesSource).toMatch(/RecommendInGroupChatDocs/);
    expect(routesSource).toMatch(/groupChatsHttp\.preHandler/);
    expect(routesSource).toMatch(/groupChatsHttp\.handlers\.createGroupChat/);
    expect(routesSource).toMatch(/groupChatsHttp\.handlers\.recommendInGroupChat/);
  });
});
