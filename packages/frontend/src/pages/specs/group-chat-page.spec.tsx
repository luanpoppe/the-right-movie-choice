jest.mock("lucide-react", () => ({
  Send: () => <span />,
  RotateCcw: () => <span />,
  Loader2: () => <span />,
  Pencil: () => <span />,
  Trash2: () => <span />,
  X: () => <span />,
  Bot: () => <span />,
  User: () => <span />,
}));

jest.mock("@/features/movies/context/user-movie-entries.context", () => ({
  UserMovieEntriesProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock("@/components/movie-card", () => ({
  MovieCard: ({ movie }: { movie: { title: string } }) => (
    <div data-testid="movie-card">{movie.title}</div>
  ),
}));

jest.mock("@/features/social/hooks/use-group-chat", () => ({
  useGroupChat: jest.fn(),
}));

jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/features/social/services/group-chats.service", () => ({
  GroupChatsService: {
    getByChatId: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    updateTitle: jest.fn(),
    delete: jest.fn(),
    updateFilterMembers: jest.fn(),
    recommend: jest.fn(),
  },
}));

jest.mock("@/features/social/services/user-groups.service", () => ({
  UserGroupsService: {
    listMembers: jest.fn(),
  },
}));

jest.mock("@/features/social/components/social-confirm-dialog", () => ({
  SocialConfirmDialog: ({
    open,
    onConfirm,
  }: {
    open: boolean;
    onConfirm: () => void | Promise<void>;
  }) => {
    if (!open) {
      return null;
    }

    return (
      <button type="button" onClick={onConfirm}>
        Confirm
      </button>
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

import { AxiosError } from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { GroupChatGetResponse } from "@/features/social/dto/group-chats.dto";
import { GroupChatsService } from "@/features/social/services/group-chats.service";
import { useGroupChat } from "@/features/social/hooks/use-group-chat";
import { UserGroupsService } from "@/features/social/services/user-groups.service";
import { GroupChatPage } from "../GroupChatPage";

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseGroupChat = jest.mocked(useGroupChat);
const mockedGetByChatId = jest.mocked(GroupChatsService.getByChatId);
const mockedList = jest.mocked(GroupChatsService.list);
const mockedDelete = jest.mocked(GroupChatsService.delete);
const mockedListMembers = jest.mocked(UserGroupsService.listMembers);
const mockedToastError = jest.mocked(toast.error);
const mockHandleSubmit = jest.fn();
const mockRefetch = jest.fn().mockResolvedValue(undefined);

const CHAT_UUID = "550e8400-e29b-41d4-a716-446655440000";
const GROUP_ID = 3;

class GroupChatPageFixtures {
  static encodeJwtPart(value: object): string {
    const json = JSON.stringify(value);
    const base64 = btoa(json);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  static createAccessToken(userId: number): string {
    const header = GroupChatPageFixtures.encodeJwtPart({
      alg: "HS256",
      typ: "JWT",
    });
    const payload = GroupChatPageFixtures.encodeJwtPart({
      sub: String(userId),
    });
    return `${header}.${payload}.signature`;
  }

  static chatResponse(
    overrides: Partial<GroupChatGetResponse> = {},
  ): GroupChatGetResponse {
    return {
      id: 40,
      groupId: GROUP_ID,
      chatId: CHAT_UUID,
      title: null,
      filterMemberUserIds: [7, 12, 15],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      messages: [
        ["user", "olá"],
        ["ai", "Olá!"],
      ],
      ...overrides,
    };
  }

  static createAxiosError(status: number): AxiosError {
    const axiosError = new AxiosError("request failed");
    axiosError.response = {
      status,
      data: {},
      headers: {},
      statusText: String(status),
      config: {} as never,
    };
    return axiosError;
  }
}

function GroupDetailPageStub() {
  const location = useLocation();
  const tabState = (location.state as { tab?: string } | null)?.tab ?? "";

  return (
    <div data-testid="group-detail-page">
      Group detail
      <span data-testid="group-detail-tab-state">{tabState}</span>
    </div>
  );
}

function renderGroupChatPage(
  path = `/social/groups/${GROUP_ID}/chats/${CHAT_UUID}`,
  accessToken: string | null = GroupChatPageFixtures.createAccessToken(1),
) {
  mockedUseAuth.mockReturnValue({
    accessToken,
    setAccessToken: jest.fn(),
    clearSession: jest.fn(),
  });

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/social/groups/:groupId/chats/:chatId"
          element={<GroupChatPage />}
        />
        <Route path="/social/groups/:id" element={<GroupDetailPageStub />} />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        <Route path="/social" element={<div data-testid="social-page">Social</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GroupChatPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetByChatId.mockResolvedValue(GroupChatPageFixtures.chatResponse());
    mockedList.mockResolvedValue([GroupChatPageFixtures.chatResponse()]);
    mockedDelete.mockResolvedValue(undefined);
    mockedListMembers.mockResolvedValue([
      { id: 7, name: "Ana", email: "ana@example.com" },
    ]);
    mockHandleSubmit.mockReset();
    mockRefetch.mockResolvedValue(undefined);
    mockedUseGroupChat.mockReturnValue({
      messages: [
        { from: "user", message: "olá" },
        { from: "ai", message: "Olá!" },
      ],
      setMessages: jest.fn(),
      isLoading: false,
      isPolling: false,
      chatSummary: {
        id: 40,
        groupId: GROUP_ID,
        chatId: CHAT_UUID,
        title: null,
        filterMemberUserIds: [7, 12, 15],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      updateFilterMemberUserIds: jest.fn(),
      handleSubmit: mockHandleSubmit,
      refetch: mockRefetch,
      sidebarRefreshKey: 0,
    });
  });

  it("REQ-8: visitante não autenticado redireciona para login com redirect", async () => {
    renderGroupChatPage(
      `/social/groups/${GROUP_ID}/chats/${CHAT_UUID}`,
      null,
    );

    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });
  });

  it("REQ-8: GET chat 404 redireciona para grupo com aba Chat", async () => {
    mockedGetByChatId.mockRejectedValue(
      GroupChatPageFixtures.createAxiosError(404),
    );

    renderGroupChatPage();

    await waitFor(() => {
      expect(screen.getByTestId("group-detail-page")).toBeInTheDocument();
    });
  });

  it("REQ-3: carrega chat e exibe sidebar com conversa", async () => {
    renderGroupChatPage();

    expect(
      await screen.findByRole("complementary", { name: "Group chats" }),
    ).toBeInTheDocument();
    expect(screen.getByText("olá")).toBeInTheDocument();
    expect(screen.getByText("Olá!")).toBeInTheDocument();
  });

  it("REQ-4: não exibe toggle pessoal excludeWatched no formulário", async () => {
    renderGroupChatPage();

    await screen.findByText("olá");

    expect(
      screen.queryByRole("checkbox", { name: /exclude watched movies/i }),
    ).not.toBeInTheDocument();
  });

  it("REQ-7: excluir chat ativo na sidebar navega para grupo com aba Chat", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue([
      GroupChatPageFixtures.chatResponse({ title: "Active chat" }),
      GroupChatPageFixtures.chatResponse({
        id: 41,
        chatId: "660e8400-e29b-41d4-a716-446655440001",
        title: "Other chat",
      }),
    ]);

    renderGroupChatPage();

    await screen.findByRole("complementary", { name: "Group chats" });

    const deleteButtons = await screen.findAllByRole("button", {
      name: "Delete chat",
    });
    await user.click(deleteButtons[0]);
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(screen.getByTestId("group-detail-page")).toBeInTheDocument();
    });

    expect(screen.getByTestId("group-detail-tab-state")).toHaveTextContent(
      "chat",
    );
    expect(mockedDelete).toHaveBeenCalledWith(GROUP_ID, 40);
  });

  it("REQ-6: abre dialog de filtro de assistidos", async () => {
    const user = userEvent.setup();
    renderGroupChatPage();

    await user.click(
      await screen.findByRole("button", { name: /watched movies filter/i }),
    );

    expect(
      await screen.findByRole("heading", { name: /watched movies filter/i }),
    ).toBeInTheDocument();
    expect(mockedListMembers).toHaveBeenCalledWith(GROUP_ID);
  });

  it("edge: params inválidos redirecionam para /social", async () => {
    renderGroupChatPage(`/social/groups/${GROUP_ID}/chats/not-a-uuid`);

    await waitFor(() => {
      expect(screen.getByTestId("social-page")).toBeInTheDocument();
    });
  });

  it("REQ-12: erro genérico ao carregar chat mostra toast", async () => {
    mockedGetByChatId.mockRejectedValue(new Error("network"));

    renderGroupChatPage();

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Unexpected Error. Try again or get in contact with the staff.",
      );
    });

    expect(
      screen.getByText(/could not load this chat/i),
    ).toBeInTheDocument();
  });
});
