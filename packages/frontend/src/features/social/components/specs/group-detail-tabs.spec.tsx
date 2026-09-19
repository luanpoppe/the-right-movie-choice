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

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { GroupChatsService } from "@/features/social/services/group-chats.service";
import { GroupDetailTabs } from "../group-detail-tabs";

const mockedListChats = jest.mocked(GroupChatsService.list);

function renderGroupDetailTabs(
  options: {
    initialEntry?: { pathname: string; state?: { tab?: string } };
  } = {},
) {
  const initialEntry = options.initialEntry ?? {
    pathname: "/social/groups/3",
  };

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <GroupDetailTabs
        groupId={3}
        detailsContent={<p>Group details panel</p>}
      />
    </MemoryRouter>,
  );
}

describe("GroupDetailTabs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedListChats.mockResolvedValue([]);
  });

  it("REQ-1: exibe abas Detalhes e Chat", () => {
    renderGroupDetailTabs();

    expect(screen.getByRole("tab", { name: "Details" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Chat" })).toBeInTheDocument();
    expect(screen.getByText("Group details panel")).toBeInTheDocument();
  });

  it("REQ-1: aba Chat mostra lista de chats do grupo", async () => {
    const user = userEvent.setup();
    renderGroupDetailTabs();

    await user.click(screen.getByRole("tab", { name: "Chat" }));

    expect(
      await screen.findByText(/group recommendation chats shared/i),
    ).toBeInTheDocument();
    expect(mockedListChats).toHaveBeenCalledWith(3);
  });

  it("REQ-8: state tab=chat abre aba Chat por padrão", async () => {
    renderGroupDetailTabs({
      initialEntry: {
        pathname: "/social/groups/3",
        state: { tab: "chat" },
      },
    });

    expect(
      await screen.findByText(/group recommendation chats shared/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Group details panel")).not.toBeInTheDocument();
  });
});
