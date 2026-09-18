jest.mock("@/features/social/services/user-groups.service", () => ({
  UserGroupsService: {
    listGroups: jest.fn(),
    create: jest.fn(),
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
import { MemoryRouter } from "react-router";
import toast from "react-hot-toast";
import { UserGroupsService } from "@/features/social/services/user-groups.service";
import { GroupsTab } from "../groups-tab";

const mockedListGroups = jest.mocked(UserGroupsService.listGroups);
const mockedCreate = jest.mocked(UserGroupsService.create);
const mockedToastSuccess = jest.mocked(toast.success);
const mockedToastError = jest.mocked(toast.error);

class GroupsTabFixtures {
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

  static createdGroup(overrides: Record<string, unknown> = {}) {
    return {
      id: 7,
      name: "Sci-Fi Night",
      description: "Space movies",
      ownerId: 1,
      createdAt: "2026-03-16T12:00:00.000Z",
      updatedAt: "2026-03-16T12:00:00.000Z",
      ...overrides,
    };
  }
}

function renderGroupsTab() {
  return render(
    <MemoryRouter>
      <GroupsTab />
    </MemoryRouter>,
  );
}

describe("GroupsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedListGroups.mockResolvedValue([]);
    mockedCreate.mockResolvedValue(GroupsTabFixtures.createdGroup());
  });

  it("REQ-7: list shows group name and member count", async () => {
    mockedListGroups.mockResolvedValue([GroupsTabFixtures.groupListItem()]);

    renderGroupsTab();

    expect(await screen.findByText("Movie Club")).toBeInTheDocument();
    expect(screen.getByText(/4 members/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /movie club/i })).toHaveAttribute(
      "href",
      "/social/groups/3",
    );
  });

  it("REQ-7: create form submits", async () => {
    const user = userEvent.setup();

    renderGroupsTab();

    await screen.findByRole("button", { name: /create group/i });

    await user.type(screen.getByLabelText(/^name$/i), "Sci-Fi Night");
    await user.type(
      screen.getByLabelText(/description \(optional\)/i),
      "Space movies",
    );
    await user.click(screen.getByRole("button", { name: /create group/i }));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith({
        name: "Sci-Fi Night",
        description: "Space movies",
      });
    });

    expect(mockedToastSuccess).toHaveBeenCalledWith(
      "Group created successfully.",
    );
    expect(mockedListGroups).toHaveBeenCalledTimes(2);
  });

  it("shows empty state when user has no groups", async () => {
    renderGroupsTab();

    expect(
      await screen.findByText(/you are not in any groups yet/i),
    ).toBeInTheDocument();
  });

  it("REQ-12: shows generic error toast when list fails", async () => {
    mockedListGroups.mockRejectedValue(new Error("network error"));

    renderGroupsTab();

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Unexpected Error. Try again or get in contact with the staff.",
      );
    });

    expect(screen.getByText(/could not load your groups/i)).toBeInTheDocument();
  });
});
