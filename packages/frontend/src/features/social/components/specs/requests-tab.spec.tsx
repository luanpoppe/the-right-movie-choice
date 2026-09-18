jest.mock("@/features/social/services/friendship.service", () => ({
  FriendshipService: {
    listIncomingFriendRequests: jest.fn(),
    listOutgoingFriendRequests: jest.fn(),
    acceptFriendRequest: jest.fn(),
    rejectFriendRequest: jest.fn(),
    cancelFriendRequest: jest.fn(),
  },
}));

jest.mock("@/features/social/services/user-groups.service", () => ({
  UserGroupsService: {
    listIncomingInvites: jest.fn(),
    acceptInvite: jest.fn(),
    rejectInvite: jest.fn(),
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import type {
  IncomingFriendRequestResponse,
  OutgoingFriendRequestResponse,
} from "@/features/social/dto/friendship.dto";
import type { IncomingGroupInviteResponse } from "@/features/social/dto/user-groups.dto";
import { FriendshipService } from "@/features/social/services/friendship.service";
import { UserGroupsService } from "@/features/social/services/user-groups.service";
import { RequestsTab } from "../requests-tab";

const mockedListIncomingFriendRequests = jest.mocked(
  FriendshipService.listIncomingFriendRequests,
);
const mockedListOutgoingFriendRequests = jest.mocked(
  FriendshipService.listOutgoingFriendRequests,
);
const mockedAcceptFriendRequest = jest.mocked(
  FriendshipService.acceptFriendRequest,
);
const mockedRejectFriendRequest = jest.mocked(
  FriendshipService.rejectFriendRequest,
);
const mockedCancelFriendRequest = jest.mocked(
  FriendshipService.cancelFriendRequest,
);
const mockedListIncomingInvites = jest.mocked(
  UserGroupsService.listIncomingInvites,
);
const mockedAcceptInvite = jest.mocked(UserGroupsService.acceptInvite);
const mockedRejectInvite = jest.mocked(UserGroupsService.rejectInvite);
const mockedToastError = jest.mocked(toast.error);
const mockedToastSuccess = jest.mocked(toast.success);

class RequestsTabFixtures {
  static incomingFriendRequest(
    overrides: Partial<IncomingFriendRequestResponse> = {},
  ): IncomingFriendRequestResponse {
    return {
      id: 20,
      requester: {
        id: 1,
        name: "Maria Silva",
        email: "maria@example.com",
      },
      status: "pending",
      createdAt: "2026-01-16T12:00:00.000Z",
      ...overrides,
    };
  }

  static outgoingFriendRequest(
    overrides: Partial<OutgoingFriendRequestResponse> = {},
  ): OutgoingFriendRequestResponse {
    return {
      id: 30,
      addressee: {
        id: 3,
        name: "João Santos",
        email: "joao@example.com",
      },
      status: "pending",
      createdAt: "2026-01-17T14:00:00.000Z",
      ...overrides,
    };
  }

  static incomingGroupInvite(
    overrides: Partial<IncomingGroupInviteResponse> = {},
  ): IncomingGroupInviteResponse {
    return {
      id: 10,
      group: { id: 3, name: "Movie Club" },
      inviter: { id: 1, name: "Ana Costa", email: "ana@example.com" },
      status: "pending",
      createdAt: "2026-03-15T12:00:00.000Z",
      ...overrides,
    };
  }
}

function renderRequestsTab() {
  return render(<RequestsTab />);
}

describe("RequestsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedListIncomingFriendRequests.mockResolvedValue([]);
    mockedListOutgoingFriendRequests.mockResolvedValue([]);
    mockedListIncomingInvites.mockResolvedValue([]);
    mockedAcceptFriendRequest.mockResolvedValue({
      id: 20,
      requesterId: 1,
      addresseeId: 2,
      status: "accepted",
      createdAt: "2026-01-16T12:00:00.000Z",
      updatedAt: "2026-01-16T12:30:00.000Z",
    });
    mockedRejectFriendRequest.mockResolvedValue({
      id: 20,
      requesterId: 1,
      addresseeId: 2,
      status: "rejected",
      createdAt: "2026-01-16T12:00:00.000Z",
      updatedAt: "2026-01-16T12:30:00.000Z",
    });
    mockedCancelFriendRequest.mockResolvedValue(undefined);
    mockedAcceptInvite.mockResolvedValue({
      id: 10,
      groupId: 3,
      inviterId: 1,
      inviteeId: 2,
      status: "accepted",
      createdAt: "2026-03-15T12:00:00.000Z",
      updatedAt: "2026-03-15T12:30:00.000Z",
    });
    mockedRejectInvite.mockResolvedValue({
      id: 10,
      groupId: 3,
      inviterId: 1,
      inviteeId: 2,
      status: "rejected",
      createdAt: "2026-03-15T12:00:00.000Z",
      updatedAt: "2026-03-15T12:30:00.000Z",
    });
  });

  it("REQ-5: incoming section shows requester and accept/reject actions", async () => {
    mockedListIncomingFriendRequests.mockResolvedValue([
      RequestsTabFixtures.incomingFriendRequest(),
    ]);

    renderRequestsTab();

    expect(
      await screen.findByRole("heading", { name: /incoming friend requests/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Maria Silva (maria@example.com)"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /accept friend request from maria silva/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /reject friend request from maria silva/i,
      }),
    ).toBeInTheDocument();
  });

  it("REQ-5: outgoing section shows addressee and cancel action", async () => {
    mockedListOutgoingFriendRequests.mockResolvedValue([
      RequestsTabFixtures.outgoingFriendRequest(),
    ]);

    renderRequestsTab();

    expect(
      await screen.findByRole("heading", { name: /outgoing friend requests/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("João Santos (joao@example.com)"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /cancel friend request to joão santos/i,
      }),
    ).toBeInTheDocument();
  });

  it("REQ-6: group invite section shows group and inviter names", async () => {
    mockedListIncomingInvites.mockResolvedValue([
      RequestsTabFixtures.incomingGroupInvite(),
    ]);

    renderRequestsTab();

    expect(
      await screen.findByRole("heading", { name: /group invites/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Movie Club")).toBeInTheDocument();
    expect(screen.getByText(/invited by ana costa/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /accept invite to movie club/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reject invite to movie club/i }),
    ).toBeInTheDocument();
  });

  it("edge: empty sections show specific messages", async () => {
    renderRequestsTab();

    expect(
      await screen.findByText(/you have no incoming friend requests/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/you have no outgoing friend requests/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/you have no group invites/i)).toBeInTheDocument();
  });

  it("REQ-12: shows generic error toast when load fails", async () => {
    mockedListIncomingFriendRequests.mockRejectedValue(new Error("network"));

    renderRequestsTab();

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Unexpected Error. Try again or get in contact with the staff.",
      );
    });

    expect(
      screen.getByText(/could not load your requests/i),
    ).toBeInTheDocument();
  });

  it("REQ-5: accepting incoming request refreshes lists", async () => {
    const user = userEvent.setup();
    mockedListIncomingFriendRequests
      .mockResolvedValueOnce([RequestsTabFixtures.incomingFriendRequest()])
      .mockResolvedValueOnce([]);

    renderRequestsTab();

    const acceptButton = await screen.findByRole("button", {
      name: /accept friend request from maria silva/i,
    });
    await user.click(acceptButton);

    await waitFor(() => {
      expect(mockedAcceptFriendRequest).toHaveBeenCalledWith(20);
    });

    expect(mockedToastSuccess).toHaveBeenCalledWith("Friend request accepted.");
    expect(mockedListIncomingFriendRequests).toHaveBeenCalledTimes(2);
  });

  it("REQ-6: rejecting group invite refreshes lists", async () => {
    const user = userEvent.setup();
    mockedListIncomingInvites
      .mockResolvedValueOnce([RequestsTabFixtures.incomingGroupInvite()])
      .mockResolvedValueOnce([]);

    renderRequestsTab();

    const rejectButton = await screen.findByRole("button", {
      name: /reject invite to movie club/i,
    });
    await user.click(rejectButton);

    await waitFor(() => {
      expect(mockedRejectInvite).toHaveBeenCalledWith(10);
    });

    expect(mockedToastSuccess).toHaveBeenCalledWith("Group invite rejected.");
    expect(mockedListIncomingInvites).toHaveBeenCalledTimes(2);
  });
});
