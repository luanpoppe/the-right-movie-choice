jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/features/social/services/friendship.service", () => ({
  FriendshipService: {
    listFriends: jest.fn(),
    sendFriendRequest: jest.fn(),
    removeFriend: jest.fn(),
    listIncomingFriendRequests: jest.fn(),
    listOutgoingFriendRequests: jest.fn(),
    acceptFriendRequest: jest.fn(),
    rejectFriendRequest: jest.fn(),
    cancelFriendRequest: jest.fn(),
  },
}));

jest.mock("@/features/social/services/user-groups.service", () => ({
  UserGroupsService: {
    listGroups: jest.fn(),
    create: jest.fn(),
    listIncomingInvites: jest.fn(),
    acceptInvite: jest.fn(),
    rejectInvite: jest.fn(),
  },
}));

jest.mock("@/features/social/components/social-confirm-dialog", () => ({
  SocialConfirmDialog: () => null,
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
import { useAuth } from "@/features/auth/context/AuthContext";
import { FriendshipService } from "@/features/social/services/friendship.service";
import { UserGroupsService } from "@/features/social/services/user-groups.service";
import { SocialPage } from "../SocialPage";

const mockedUseAuth = jest.mocked(useAuth);
const mockedListFriends = jest.mocked(FriendshipService.listFriends);
const mockedListIncomingFriendRequests = jest.mocked(
  FriendshipService.listIncomingFriendRequests,
);
const mockedListOutgoingFriendRequests = jest.mocked(
  FriendshipService.listOutgoingFriendRequests,
);
const mockedListIncomingInvites = jest.mocked(
  UserGroupsService.listIncomingInvites,
);
const mockedListGroups = jest.mocked(UserGroupsService.listGroups);

function renderSocialPage(initialEntry = "/social") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/social" element={<SocialPage />} />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SocialPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedListFriends.mockResolvedValue([]);
    mockedListIncomingFriendRequests.mockResolvedValue([]);
    mockedListOutgoingFriendRequests.mockResolvedValue([]);
    mockedListIncomingInvites.mockResolvedValue([]);
    mockedListGroups.mockResolvedValue([]);
  });

  it("REQ-2: visitante é redirecionado para login com retorno /social", async () => {
    mockedUseAuth.mockReturnValue({
      accessToken: null,
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    renderSocialPage();

    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });
  });

  describe("usuário autenticado", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        accessToken: "token",
        setAccessToken: jest.fn(),
        clearSession: jest.fn(),
      });
    });

    it("REQ-1: exibe abas Friends, Requests e Groups com Friends selecionada", async () => {
      renderSocialPage();

      const friendsTab = screen.getByRole("tab", { name: "Friends" });
      const requestsTab = screen.getByRole("tab", { name: "Requests" });
      const groupsTab = screen.getByRole("tab", { name: "Groups" });

      expect(friendsTab).toBeInTheDocument();
      expect(requestsTab).toBeInTheDocument();
      expect(groupsTab).toBeInTheDocument();
      expect(friendsTab).toHaveAttribute("data-state", "active");
      expect(requestsTab).toHaveAttribute("data-state", "inactive");
      expect(groupsTab).toHaveAttribute("data-state", "inactive");

      await waitFor(() => {
        expect(
          screen.getByLabelText("Add friend by email"),
        ).toBeInTheDocument();
      });
    });

    it("REQ-1: troca de aba exibe conteúdo da aba selecionada", async () => {
      const user = userEvent.setup();

      renderSocialPage();

      await waitFor(() => {
        expect(
          screen.getByLabelText("Add friend by email"),
        ).toBeInTheDocument();
      });

      const requestsTab = screen.getByRole("tab", { name: "Requests" });
      await user.click(requestsTab);

      expect(requestsTab).toHaveAttribute("data-state", "active");
      expect(
        await screen.findByText(/you have no incoming friend requests/i),
      ).toBeInTheDocument();

      const groupsTab = screen.getByRole("tab", { name: "Groups" });
      await user.click(groupsTab);

      expect(groupsTab).toHaveAttribute("data-state", "active");
      expect(
        await screen.findByText(/you are not in any groups yet/i),
      ).toBeInTheDocument();
    });
  });
});
