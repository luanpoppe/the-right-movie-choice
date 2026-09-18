import { movieClient } from "@/lib/api/movie-client";
import { UserGroupsService } from "../user-groups.service";

jest.mock("@/lib/api/movie-client", () => ({
  movieClient: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedPost = jest.mocked(movieClient.post);
const mockedGet = jest.mocked(movieClient.get);
const mockedPatch = jest.mocked(movieClient.patch);
const mockedDelete = jest.mocked(movieClient.delete);

class UserGroupsServiceFixtures {
  static group(overrides: Record<string, unknown> = {}) {
    return {
      id: 3,
      name: "Movie Club",
      description: "Weekly picks",
      ownerId: 1,
      createdAt: "2026-03-15T12:00:00.000Z",
      updatedAt: "2026-03-15T12:30:00.000Z",
      ...overrides,
    };
  }

  static groupListItem(overrides: Record<string, unknown> = {}) {
    return {
      id: 3,
      name: "Movie Club",
      description: "Weekly picks",
      ownerId: 1,
      memberCount: 4,
      joinedAt: "2026-03-15T12:00:00.000Z",
      ...overrides,
    };
  }

  static invite(overrides: Record<string, unknown> = {}) {
    return {
      id: 10,
      groupId: 3,
      inviterId: 1,
      inviteeId: 2,
      status: "pending",
      createdAt: "2026-03-15T12:00:00.000Z",
      updatedAt: "2026-03-15T12:00:00.000Z",
      ...overrides,
    };
  }

  static suggestion(overrides: Record<string, unknown> = {}) {
    return {
      id: 5,
      name: "Maria",
      email: "maria@example.com",
      ...overrides,
    };
  }

  static incomingInvite(overrides: Record<string, unknown> = {}) {
    return {
      id: 10,
      group: { id: 3, name: "Movie Club" },
      inviter: { id: 1, name: "João", email: "joao@example.com" },
      status: "pending",
      createdAt: "2026-03-15T12:00:00.000Z",
      ...overrides,
    };
  }
}

describe("UserGroupsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create chama POST /social/groups com body", async () => {
    const group = UserGroupsServiceFixtures.group();
    const createBody = { name: "Movie Club", description: "Weekly picks" };
    mockedPost.mockResolvedValue({ data: group });

    const result = await UserGroupsService.create(createBody);

    expect(mockedPost).toHaveBeenCalledWith("/social/groups", createBody);
    expect(result).toEqual(group);
  });

  it("listGroups chama GET /social/groups", async () => {
    const listItem = UserGroupsServiceFixtures.groupListItem();
    mockedGet.mockResolvedValue({ data: [listItem] });

    const result = await UserGroupsService.listGroups();

    expect(mockedGet).toHaveBeenCalledWith("/social/groups");
    expect(result).toEqual([listItem]);
  });

  it("update envia PATCH /social/groups/:id", async () => {
    const group = UserGroupsServiceFixtures.group({ name: "Renamed" });
    const patchBody = { name: "Renamed" };
    mockedPatch.mockResolvedValue({ data: group });

    const result = await UserGroupsService.update(3, patchBody);

    expect(mockedPatch).toHaveBeenCalledWith("/social/groups/3", patchBody);
    expect(result.name).toBe("Renamed");
  });

  it("delete chama DELETE /social/groups/:id", async () => {
    mockedDelete.mockResolvedValue({ data: undefined });

    await UserGroupsService.delete(3);

    expect(mockedDelete).toHaveBeenCalledWith("/social/groups/3");
  });

  it("sendInvite chama POST /social/groups/:id/invites", async () => {
    const invite = UserGroupsServiceFixtures.invite();
    const inviteBody = { email: "maria@example.com" };
    mockedPost.mockResolvedValue({ data: invite });

    const result = await UserGroupsService.sendInvite(3, inviteBody);

    expect(mockedPost).toHaveBeenCalledWith(
      "/social/groups/3/invites",
      inviteBody,
    );
    expect(result).toEqual(invite);
  });

  it("leaveGroup chama DELETE /social/groups/:id/members/me", async () => {
    mockedDelete.mockResolvedValue({ data: undefined });

    await UserGroupsService.leaveGroup(3);

    expect(mockedDelete).toHaveBeenCalledWith("/social/groups/3/members/me");
  });

  it("removeMember chama DELETE /social/groups/:id/members/:userId", async () => {
    mockedDelete.mockResolvedValue({ data: undefined });

    await UserGroupsService.removeMember(3, 7);

    expect(mockedDelete).toHaveBeenCalledWith("/social/groups/3/members/7");
  });

  it("listSuggestions chama GET /social/groups/:id/suggestions", async () => {
    const suggestion = UserGroupsServiceFixtures.suggestion();
    mockedGet.mockResolvedValue({ data: [suggestion] });

    const result = await UserGroupsService.listSuggestions(3);

    expect(mockedGet).toHaveBeenCalledWith("/social/groups/3/suggestions");
    expect(result).toEqual([suggestion]);
  });

  it("listIncomingInvites chama GET /social/group-invites/incoming", async () => {
    const incomingInvite = UserGroupsServiceFixtures.incomingInvite();
    mockedGet.mockResolvedValue({ data: [incomingInvite] });

    const result = await UserGroupsService.listIncomingInvites();

    expect(mockedGet).toHaveBeenCalledWith("/social/group-invites/incoming");
    expect(result).toEqual([incomingInvite]);
  });

  it("acceptInvite chama POST /social/group-invites/:id/accept", async () => {
    const invite = UserGroupsServiceFixtures.invite({ status: "accepted" });
    mockedPost.mockResolvedValue({ data: invite });

    const result = await UserGroupsService.acceptInvite(10);

    expect(mockedPost).toHaveBeenCalledWith("/social/group-invites/10/accept");
    expect(result.status).toBe("accepted");
  });

  it("rejectInvite chama POST /social/group-invites/:id/reject", async () => {
    const invite = UserGroupsServiceFixtures.invite({ status: "rejected" });
    mockedPost.mockResolvedValue({ data: invite });

    const result = await UserGroupsService.rejectInvite(10);

    expect(mockedPost).toHaveBeenCalledWith("/social/group-invites/10/reject");
    expect(result.status).toBe("rejected");
  });

  it("cancelInvite chama DELETE /social/group-invites/:id", async () => {
    mockedDelete.mockResolvedValue({ data: undefined });

    await UserGroupsService.cancelInvite(10);

    expect(mockedDelete).toHaveBeenCalledWith("/social/group-invites/10");
  });
});
