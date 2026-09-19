jest.mock("lucide-react", () => ({
  X: () => <span />,
}));

jest.mock("@/features/social/services/group-chats.service", () => ({
  GroupChatsService: {
    updateFilterMembers: jest.fn(),
  },
}));

jest.mock("@/features/social/services/user-groups.service", () => ({
  UserGroupsService: {
    listMembers: jest.fn(),
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
import axios from "axios";
import toast from "react-hot-toast";
import type { GroupChatUpdateFilterMembersResponse } from "@/features/social/dto/group-chats.dto";
import type { UserPublicResponse } from "@/features/social/dto/friendship.dto";
import { GroupChatsService } from "@/features/social/services/group-chats.service";
import { UserGroupsService } from "@/features/social/services/user-groups.service";
import { GroupChatFilterMembersDialog } from "../group-chat-filter-members-dialog";

const mockedListMembers = jest.mocked(UserGroupsService.listMembers);
const mockedUpdateFilterMembers = jest.mocked(
  GroupChatsService.updateFilterMembers,
);
const mockedToastError = jest.mocked(toast.error);

const GROUP_ID = 3;
const CHAT_ID = 40;

class GroupChatFilterMembersDialogFixtures {
  static member(
    overrides: Partial<UserPublicResponse> = {},
  ): UserPublicResponse {
    return {
      id: 7,
      name: "Ana Silva",
      email: "ana@example.com",
      ...overrides,
    };
  }

  static updatedChat(
    filterMemberUserIds: number[],
  ): GroupChatUpdateFilterMembersResponse {
    return {
      id: CHAT_ID,
      groupId: GROUP_ID,
      chatId: "550e8400-e29b-41d4-a716-446655440000",
      title: null,
      filterMemberUserIds,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-03-16T12:00:00.000Z",
    };
  }
}

function renderDialog(
  props: {
    currentFilterMemberUserIds?: number[];
    onSaved?: (result: GroupChatUpdateFilterMembersResponse) => void;
  } = {},
) {
  const onSaved = props.onSaved ?? jest.fn();
  const onOpenChange = jest.fn();

  render(
    <GroupChatFilterMembersDialog
      open={true}
      onOpenChange={onOpenChange}
      groupId={GROUP_ID}
      chatId={CHAT_ID}
      currentFilterMemberUserIds={props.currentFilterMemberUserIds ?? [7, 12, 15]}
      onSaved={onSaved}
    />,
  );

  return { onSaved, onOpenChange };
}

describe("GroupChatFilterMembersDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedListMembers.mockResolvedValue([
      GroupChatFilterMembersDialogFixtures.member({ id: 7, name: "Ana Silva" }),
      GroupChatFilterMembersDialogFixtures.member({
        id: 12,
        name: "Bruno Costa",
        email: "bruno@example.com",
      }),
      GroupChatFilterMembersDialogFixtures.member({
        id: 15,
        name: "Carla Dias",
        email: "carla@example.com",
      }),
    ]);
    mockedUpdateFilterMembers.mockResolvedValue(
      GroupChatFilterMembersDialogFixtures.updatedChat([7, 12]),
    );
  });

  it("REQ-6: desmarca membro e salva chama PATCH com userIds atualizados", async () => {
    const user = userEvent.setup();
    const { onSaved } = renderDialog();

    await screen.findByText("Ana Silva");

    const carlaCheckbox = screen.getByRole("checkbox", {
      name: /carla dias/i,
    });
    await user.click(carlaCheckbox);

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockedUpdateFilterMembers).toHaveBeenCalledWith(
        GROUP_ID,
        CHAT_ID,
        [7, 12],
      );
    });

    expect(onSaved).toHaveBeenCalledWith(
      GroupChatFilterMembersDialogFixtures.updatedChat([7, 12]),
    );
  });

  it("REQ-6: atalho Selecionar todos marca todos os membros", async () => {
    const user = userEvent.setup();
    renderDialog({ currentFilterMemberUserIds: [] });

    await screen.findByText("Ana Silva");

    await user.click(screen.getByRole("button", { name: "Select all" }));

    const anaCheckbox = screen.getByRole("checkbox", { name: /ana silva/i });
    const brunoCheckbox = screen.getByRole("checkbox", {
      name: /bruno costa/i,
    });
    const carlaCheckbox = screen.getByRole("checkbox", {
      name: /carla dias/i,
    });

    expect(anaCheckbox).toBeChecked();
    expect(brunoCheckbox).toBeChecked();
    expect(carlaCheckbox).toBeChecked();
  });

  it("edge: filterMemberUserIds vazio após desmarcar todos e salvar", async () => {
    const user = userEvent.setup();
    const { onSaved } = renderDialog();

    await screen.findByText("Ana Silva");

    await user.click(screen.getByRole("button", { name: "Deselect all" }));

    mockedUpdateFilterMembers.mockResolvedValue(
      GroupChatFilterMembersDialogFixtures.updatedChat([]),
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockedUpdateFilterMembers).toHaveBeenCalledWith(
        GROUP_ID,
        CHAT_ID,
        [],
      );
    });

    expect(onSaved).toHaveBeenCalledWith(
      GroupChatFilterMembersDialogFixtures.updatedChat([]),
    );
  });

  it("REQ-12: erro 400 com invalidUserIds mostra mensagem da API", async () => {
    const user = userEvent.setup();
    const axiosError = new axios.AxiosError("Bad Request");
    axiosError.response = {
      status: 400,
      data: {
        error: "Some user ids are not group members.",
        invalidUserIds: [99],
      },
      headers: {},
      statusText: "Bad Request",
      config: {} as never,
    };
    mockedUpdateFilterMembers.mockRejectedValue(axiosError);

    renderDialog();

    await screen.findByText("Ana Silva");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Some user ids are not group members.",
      );
    });
  });
});
