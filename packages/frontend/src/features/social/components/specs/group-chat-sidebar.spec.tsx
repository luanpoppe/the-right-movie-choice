jest.mock("lucide-react", () => ({
  Loader2: () => <span />,
  Pencil: () => <span />,
  Trash2: () => <span />,
}));

jest.mock("@/features/social/services/group-chats.service", () => ({
  GroupChatsService: {
    list: jest.fn(),
    create: jest.fn(),
    updateTitle: jest.fn(),
    delete: jest.fn(),
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
        Confirm delete
      </button>
    );
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import type { GroupChatSummaryResponse } from "@/features/social/dto/group-chats.dto";
import { GroupChatsService } from "@/features/social/services/group-chats.service";
import { GroupChatSidebar } from "../group-chat-sidebar";

const mockedList = jest.mocked(GroupChatsService.list);
const mockedCreate = jest.mocked(GroupChatsService.create);
const mockedDelete = jest.mocked(GroupChatsService.delete);

const ACTIVE_CHAT_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_CHAT_ID = "660e8400-e29b-41d4-a716-446655440001";
const GROUP_ID = 3;

class GroupChatSidebarFixtures {
  static summary(
    overrides: Partial<GroupChatSummaryResponse> = {},
  ): GroupChatSummaryResponse {
    return {
      id: 40,
      groupId: GROUP_ID,
      chatId: ACTIVE_CHAT_ID,
      title: "Active chat",
      filterMemberUserIds: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      ...overrides,
    };
  }
}

function renderGroupChatSidebar(
  props: {
    activeChatId?: string;
    refreshKey?: number;
    onActiveChatDeleted?: () => void;
  } = {},
) {
  const onActiveChatDeleted = props.onActiveChatDeleted ?? jest.fn();

  return {
    onActiveChatDeleted,
    ...render(
      <MemoryRouter
        initialEntries={[
          `/social/groups/${GROUP_ID}/chats/${ACTIVE_CHAT_ID}`,
        ]}
      >
        <Routes>
          <Route
            path="/social/groups/:groupId/chats/:chatId"
            element={
              <GroupChatSidebar
                groupId={GROUP_ID}
                activeChatId={props.activeChatId ?? ACTIVE_CHAT_ID}
                refreshKey={props.refreshKey ?? 0}
                onActiveChatDeleted={onActiveChatDeleted}
              />
            }
          />
          <Route
            path="/social/groups/:groupId/chats/:otherChatId"
            element={<div data-testid="other-chat-page">Other chat</div>}
          />
        </Routes>
      </MemoryRouter>,
    ),
  };
}

describe("GroupChatSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedList.mockResolvedValue([
      GroupChatSidebarFixtures.summary(),
      GroupChatSidebarFixtures.summary({
        id: 41,
        chatId: OTHER_CHAT_ID,
        title: "Other chat",
      }),
    ]);
    mockedCreate.mockResolvedValue(
      GroupChatSidebarFixtures.summary({
        chatId: "770e8400-e29b-41d4-a716-446655440002",
      }),
    );
    mockedDelete.mockResolvedValue(undefined);
  });

  it("REQ-3: exibe sidebar com lista de chats do grupo", async () => {
    renderGroupChatSidebar();

    expect(
      await screen.findByRole("complementary", { name: "Group chats" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Active chat" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Other chat" }),
    ).toBeInTheDocument();
  });

  it("REQ-7: excluir chat ativo chama onActiveChatDeleted", async () => {
    const user = userEvent.setup();
    const onActiveChatDeleted = jest.fn();
    renderGroupChatSidebar({ onActiveChatDeleted });

    const deleteButtons = await screen.findAllByRole("button", {
      name: "Delete chat",
    });
    await user.click(deleteButtons[0]);
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith(GROUP_ID, 40);
      expect(onActiveChatDeleted).toHaveBeenCalled();
    });
  });

  it("REQ-2: criar chat navega para o chat criado", async () => {
    const user = userEvent.setup();
    const createdChat = GroupChatSidebarFixtures.summary({
      chatId: "770e8400-e29b-41d4-a716-446655440002",
      title: null,
    });
    mockedCreate.mockResolvedValue(createdChat);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <GroupChatSidebar
                groupId={GROUP_ID}
                activeChatId={ACTIVE_CHAT_ID}
              />
            }
          />
          <Route
            path="/social/groups/:groupId/chats/:chatId"
            element={<div data-testid="created-chat-page">Created</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      await screen.findByRole("button", { name: "New chat" }),
    );

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith(GROUP_ID);
    });

    expect(await screen.findByTestId("created-chat-page")).toBeInTheDocument();
  });

  it("edge: refreshKey dispara novo fetch da lista", async () => {
    const { rerender } = render(
      <MemoryRouter
        initialEntries={[
          `/social/groups/${GROUP_ID}/chats/${ACTIVE_CHAT_ID}`,
        ]}
      >
        <GroupChatSidebar
          groupId={GROUP_ID}
          activeChatId={ACTIVE_CHAT_ID}
          refreshKey={0}
        />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockedList).toHaveBeenCalledTimes(1);
    });

    rerender(
      <MemoryRouter
        initialEntries={[
          `/social/groups/${GROUP_ID}/chats/${ACTIVE_CHAT_ID}`,
        ]}
      >
        <GroupChatSidebar
          groupId={GROUP_ID}
          activeChatId={ACTIVE_CHAT_ID}
          refreshKey={1}
        />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockedList).toHaveBeenCalledTimes(2);
    });
  });
});
