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
import type { GroupChatSummaryResponse } from "@/features/social/dto/group-chats.dto";
import { GroupChatsService } from "@/features/social/services/group-chats.service";
import { GroupChatsTab } from "../group-chats-tab";

const mockedList = jest.mocked(GroupChatsService.list);
const mockedCreate = jest.mocked(GroupChatsService.create);
const mockedUpdateTitle = jest.mocked(GroupChatsService.updateTitle);
const mockedDelete = jest.mocked(GroupChatsService.delete);
const mockedToastError = jest.mocked(toast.error);

const CHAT_UUID = "550e8400-e29b-41d4-a716-446655440000";
const GROUP_ID = 3;

class GroupChatsTabFixtures {
  static summary(
    overrides: Partial<GroupChatSummaryResponse> = {},
  ): GroupChatSummaryResponse {
    return {
      id: 40,
      groupId: GROUP_ID,
      chatId: CHAT_UUID,
      title: null,
      filterMemberUserIds: [7, 12, 15],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      ...overrides,
    };
  }
}

function renderGroupChatsTab() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<GroupChatsTab groupId={GROUP_ID} />} />
        <Route
          path="/social/groups/:groupId/chats/:chatId"
          element={<div data-testid="group-chat-page">Chat page</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GroupChatsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedList.mockResolvedValue([]);
    mockedCreate.mockResolvedValue(GroupChatsTabFixtures.summary());
    mockedUpdateTitle.mockResolvedValue(
      GroupChatsTabFixtures.summary({ title: "Terror leve" }),
    );
    mockedDelete.mockResolvedValue(undefined);
  });

  it("REQ-2: criar chat chama POST e navega para o chat criado", async () => {
    const user = userEvent.setup();
    const createdChat = GroupChatsTabFixtures.summary({
      chatId: "660e8400-e29b-41d4-a716-446655440001",
    });
    mockedCreate.mockResolvedValue(createdChat);

    renderGroupChatsTab();

    const createButton = await screen.findByRole("button", { name: "New chat" });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith(GROUP_ID);
    });

    expect(await screen.findByTestId("group-chat-page")).toBeInTheDocument();
  });

  it("REQ-2: lista chats ordenados por updatedAt descendente", async () => {
    const olderChat = GroupChatsTabFixtures.summary({
      id: 1,
      title: "Older",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const newerChat = GroupChatsTabFixtures.summary({
      id: 2,
      title: "Newer",
      updatedAt: "2026-03-15T12:00:00.000Z",
    });
    mockedList.mockResolvedValue([olderChat, newerChat]);

    renderGroupChatsTab();

    const chatButtons = await screen.findAllByRole("button", {
      name: /older|newer/i,
    });

    expect(chatButtons[0]).toHaveAccessibleName("Newer");
    expect(chatButtons[1]).toHaveAccessibleName("Older");
  });

  it("REQ-9: chat com title null exibe label padrão com tempo relativo", async () => {
    mockedList.mockResolvedValue([
      GroupChatsTabFixtures.summary({
        title: null,
        updatedAt: "2026-03-15T12:00:00.000Z",
      }),
    ]);

    renderGroupChatsTab();

    const chatButton = await screen.findByRole("button", {
      name: /^New Conversation · /,
    });

    expect(chatButton).toBeInTheDocument();
  });

  it("REQ-7: renomear inline chama PATCH e atualiza lista", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue([
      GroupChatsTabFixtures.summary({ title: "Old title" }),
    ]);
    mockedUpdateTitle.mockResolvedValue(
      GroupChatsTabFixtures.summary({ title: "Terror leve" }),
    );

    renderGroupChatsTab();

    await user.click(
      await screen.findByRole("button", { name: "Rename chat" }),
    );

    const titleInput = screen.getByLabelText("Chat title");
    await user.clear(titleInput);
    await user.type(titleInput, "Terror leve");
    await user.tab();

    await waitFor(() => {
      expect(mockedUpdateTitle).toHaveBeenCalledWith(
        GROUP_ID,
        40,
        "Terror leve",
      );
    });

    expect(
      await screen.findByRole("button", { name: "Terror leve" }),
    ).toBeInTheDocument();
  });

  it("REQ-7: excluir chat chama DELETE após confirmação", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue([
      GroupChatsTabFixtures.summary({ title: "To delete" }),
    ]);

    renderGroupChatsTab();

    await user.click(
      await screen.findByRole("button", { name: "Delete chat" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith(GROUP_ID, 40);
    });

    expect(
      screen.queryByRole("button", { name: "To delete" }),
    ).not.toBeInTheDocument();
  });

  it("edge: lista vazia mostra estado vazio com CTA criar primeiro chat", async () => {
    renderGroupChatsTab();

    expect(
      await screen.findByText(/does not have any chats yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "New chat" }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("abrir chat navega para rota do chat", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue([
      GroupChatsTabFixtures.summary({ title: "My chat" }),
    ]);

    renderGroupChatsTab();

    await user.click(
      await screen.findByRole("button", { name: "My chat" }),
    );

    expect(await screen.findByTestId("group-chat-page")).toBeInTheDocument();
  });

  it("REQ-12: erro ao carregar lista mostra toast genérico", async () => {
    mockedList.mockRejectedValue(new Error("network"));

    renderGroupChatsTab();

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Unexpected Error. Try again or get in contact with the staff.",
      );
    });

    expect(
      screen.getByText(/could not load group chats/i),
    ).toBeInTheDocument();
  });
});
