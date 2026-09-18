import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import toast from "react-hot-toast";
import type { UserPublicResponse } from "../../dto/friendship.dto";
import { FriendshipService } from "../../services/friendship.service";
import { FriendsTab } from "../friends-tab";

jest.mock("../../services/friendship.service", () => ({
  FriendshipService: {
    listFriends: jest.fn(),
    sendFriendRequest: jest.fn(),
    removeFriend: jest.fn(),
  },
}));

jest.mock("../social-confirm-dialog", () => ({
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

const mockedListFriends = jest.mocked(FriendshipService.listFriends);
const mockedSendFriendRequest = jest.mocked(FriendshipService.sendFriendRequest);
const mockedRemoveFriend = jest.mocked(FriendshipService.removeFriend);
const mockedToastSuccess = jest.mocked(toast.success);

class FriendsTabFixtures {
  static friend(overrides: Partial<UserPublicResponse> = {}): UserPublicResponse {
    return {
      id: 2,
      name: "Maria Silva",
      email: "maria@example.com",
      ...overrides,
    };
  }
}

function renderFriendsTab() {
  return render(
    <MemoryRouter>
      <FriendsTab />
    </MemoryRouter>,
  );
}

describe("FriendsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedListFriends.mockResolvedValue([]);
    mockedSendFriendRequest.mockResolvedValue({
      id: 1,
      requesterId: 1,
      addresseeId: 2,
      status: "pending",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    mockedRemoveFriend.mockResolvedValue(undefined);
  });

  it("REQ-3: renders friend list with name and email", async () => {
    const friend = FriendsTabFixtures.friend();
    mockedListFriends.mockResolvedValue([friend]);

    renderFriendsTab();

    await waitFor(() => {
      expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    });

    expect(screen.getByText("maria@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove friend" }),
    ).toBeInTheDocument();
  });

  it("REQ-3/REQ-10: remove friend opens confirm dialog before calling API", async () => {
    const user = userEvent.setup();
    const friend = FriendsTabFixtures.friend();
    mockedListFriends.mockResolvedValue([friend]);

    renderFriendsTab();

    await waitFor(() => {
      expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    });

    const removeButton = screen.getByRole("button", { name: "Remove friend" });
    await user.click(removeButton);

    expect(screen.getByTestId("social-confirm-dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Remove friend" })).toBeInTheDocument();
    expect(mockedRemoveFriend).not.toHaveBeenCalled();

    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockedRemoveFriend).toHaveBeenCalledWith(2);
    });
  });

  it("REQ-4: add friend form submits email via FriendshipService", async () => {
    const user = userEvent.setup();

    renderFriendsTab();

    await waitFor(() => {
      expect(screen.getByLabelText("Add friend by email")).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText("Add friend by email");
    await user.type(emailInput, "pedro@example.com");

    const submitButton = screen.getByRole("button", { name: "Send request" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedSendFriendRequest).toHaveBeenCalledWith("pedro@example.com");
    });

    expect(mockedToastSuccess).toHaveBeenCalledWith("Friend request sent.");
  });

  it("edge: empty state when user has no friends", async () => {
    mockedListFriends.mockResolvedValue([]);

    renderFriendsTab();

    await waitFor(() => {
      expect(
        screen.getByText("You do not have any friends yet."),
      ).toBeInTheDocument();
    });
  });
});
