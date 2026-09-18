jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/features/social/services/user-groups.service", () => ({
  UserGroupsService: {
    listGroups: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    sendInvite: jest.fn(),
    leaveGroup: jest.fn(),
    listSuggestions: jest.fn(),
  },
}));

jest.mock("@/features/social/components/social-confirm-dialog", () => ({
  SocialConfirmDialog: ({
    open,
    title,
    description,
    onConfirm,
  }: {
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  }) => {
    if (!open) {
      return null;
    }

    return (
      <div data-testid="social-confirm-dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <button type="button" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    );
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
import { MemoryRouter, Route, Routes } from "react-router";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import type {
  GroupFriendSuggestionResponse,
  UserGroupListItemResponse,
} from "@/features/social/dto/user-groups.dto";
import { UserGroupsService } from "@/features/social/services/user-groups.service";
import { GroupDetailPage } from "../GroupDetailPage";

const mockedUseAuth = jest.mocked(useAuth);
const mockedListGroups = jest.mocked(UserGroupsService.listGroups);
const mockedUpdate = jest.mocked(UserGroupsService.update);
const mockedDelete = jest.mocked(UserGroupsService.delete);
const mockedSendInvite = jest.mocked(UserGroupsService.sendInvite);
const mockedLeaveGroup = jest.mocked(UserGroupsService.leaveGroup);
const mockedListSuggestions = jest.mocked(UserGroupsService.listSuggestions);
const mockedToastError = jest.mocked(toast.error);
const mockedToastSuccess = jest.mocked(toast.success);

class GroupDetailPageFixtures {
  static encodeJwtPart(value: object): string {
    const json = JSON.stringify(value);
    const base64 = btoa(json);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  static createAccessToken(userId: number): string {
    const header = GroupDetailPageFixtures.encodeJwtPart({
      alg: "HS256",
      typ: "JWT",
    });
    const payload = GroupDetailPageFixtures.encodeJwtPart({
      sub: String(userId),
    });
    return `${header}.${payload}.signature`;
  }

  static groupListItem(
    overrides: Partial<UserGroupListItemResponse> = {},
  ): UserGroupListItemResponse {
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

  static suggestion(
    overrides: Partial<GroupFriendSuggestionResponse> = {},
  ): GroupFriendSuggestionResponse {
    return {
      id: 5,
      name: "Pedro Lima",
      email: "pedro@example.com",
      ...overrides,
    };
  }

  static updatedGroup(overrides: Record<string, unknown> = {}) {
    return {
      id: 3,
      name: "Movie Club",
      description: "Weekly picks",
      ownerId: 1,
      createdAt: "2026-03-15T12:00:00.000Z",
      updatedAt: "2026-03-16T12:00:00.000Z",
      ...overrides,
    };
  }
}

function renderGroupDetailPage(groupId: string, userId = 1) {
  const accessToken = GroupDetailPageFixtures.createAccessToken(userId);

  mockedUseAuth.mockReturnValue({
    accessToken,
    setAccessToken: jest.fn(),
    clearSession: jest.fn(),
  });

  return render(
    <MemoryRouter initialEntries={[`/social/groups/${groupId}`]}>
      <Routes>
        <Route path="/social/groups/:id" element={<GroupDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GroupDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedListGroups.mockResolvedValue([
      GroupDetailPageFixtures.groupListItem(),
    ]);
    mockedListSuggestions.mockResolvedValue([
      GroupDetailPageFixtures.suggestion(),
    ]);
    mockedUpdate.mockResolvedValue(GroupDetailPageFixtures.updatedGroup());
    mockedDelete.mockResolvedValue(undefined);
    mockedSendInvite.mockResolvedValue({
      id: 11,
      groupId: 3,
      inviterId: 1,
      inviteeId: 5,
      status: "pending",
      createdAt: "2026-03-16T12:00:00.000Z",
      updatedAt: "2026-03-16T12:00:00.000Z",
    });
    mockedLeaveGroup.mockResolvedValue(undefined);
  });

  it("REQ-8: shows group name, memberCount, and owner sees edit/delete", async () => {
    renderGroupDetailPage("3", 1);

    expect(await screen.findByRole("heading", { name: "Movie Club" })).toBeInTheDocument();
    expect(screen.getByText("4 members")).toBeInTheDocument();
    expect(screen.getByText("You are the owner")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Edit group" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete group" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Leave group" }),
    ).not.toBeInTheDocument();
  });

  it("REQ-8: non-owner sees leave not delete", async () => {
    renderGroupDetailPage("3", 2);

    expect(await screen.findByRole("heading", { name: "Movie Club" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Leave group" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Edit group" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete group" }),
    ).not.toBeInTheDocument();
  });

  it("REQ-9: invite form and suggestions are shown", async () => {
    const user = userEvent.setup();
    renderGroupDetailPage("3", 1);

    expect(
      await screen.findByRole("heading", { name: "Invite by email" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pedro Lima")).toBeInTheDocument();
    expect(screen.getByText("pedro@example.com")).toBeInTheDocument();

    const emailInput = screen.getByLabelText("Email");
    await user.type(emailInput, "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Send invite" }));

    await waitFor(() => {
      expect(mockedSendInvite).toHaveBeenCalledWith(3, {
        email: "ana@example.com",
      });
    });

    expect(mockedToastSuccess).toHaveBeenCalledWith("Invite sent.");

    const inviteSuggestionButton = screen.getByRole("button", {
      name: "Invite Pedro Lima",
    });
    await user.click(inviteSuggestionButton);

    await waitFor(() => {
      expect(mockedSendInvite).toHaveBeenCalledWith(3, {
        email: "pedro@example.com",
      });
    });
  });

  it("REQ-10: delete opens confirm dialog before calling API", async () => {
    const user = userEvent.setup();
    renderGroupDetailPage("3", 1);

    const deleteButton = await screen.findByRole("button", {
      name: "Delete group",
    });
    await user.click(deleteButton);

    expect(screen.getByTestId("social-confirm-dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Delete group" }),
    ).toBeInTheDocument();
    expect(mockedDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith(3);
    });
  });

  it("REQ-10: leave opens confirm dialog before calling API", async () => {
    const user = userEvent.setup();
    renderGroupDetailPage("3", 2);

    const leaveButton = await screen.findByRole("button", {
      name: "Leave group",
    });
    await user.click(leaveButton);

    expect(screen.getByTestId("social-confirm-dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Leave group" }),
    ).toBeInTheDocument();
    expect(mockedLeaveGroup).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(mockedLeaveGroup).toHaveBeenCalledWith(3);
    });
  });

  it("edge: not found when group absent from list", async () => {
    mockedListGroups.mockResolvedValue([]);

    renderGroupDetailPage("3", 1);

    expect(
      await screen.findByText(/group not found or you do not have access/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to social/i })).toHaveAttribute(
      "href",
      "/social",
    );
  });

  it("REQ-12: shows generic error toast when load fails", async () => {
    mockedListGroups.mockRejectedValue(new Error("network"));

    renderGroupDetailPage("3", 1);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Unexpected Error. Try again or get in contact with the staff.",
      );
    });

    expect(screen.getByText(/could not load this group/i)).toBeInTheDocument();
  });
});
