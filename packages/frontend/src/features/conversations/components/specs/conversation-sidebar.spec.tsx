jest.mock("@/features/conversations/services/user-conversation.service", () => ({
  UserConversationService: {
    listConversations: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("lucide-react", () => ({
  X: () => <span data-testid="close-icon" />,
  Loader2: () => <span />,
  MessageSquare: () => <span />,
  Pencil: () => <span />,
  Trash2: () => <span />,
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import {
  ConversationSidebar,
  type ConversationSidebarProps,
} from "../conversation-sidebar";

function renderSidebar(overrides: Partial<ConversationSidebarProps> = {}) {
  const props: ConversationSidebarProps = {
    activeConversationId: 1,
    refreshKey: 0,
    onActiveConversationDeleted: jest.fn(),
    isMobileOpen: false,
    onCloseMobile: jest.fn(),
    ...overrides,
  };

  render(
    <MemoryRouter>
      <ConversationSidebar {...props} />
    </MemoryRouter>,
  );

  return props;
}

describe("ConversationSidebar (mobile)", () => {
  it("mantem o drawer fora da tela quando fechado", async () => {
    renderSidebar({ isMobileOpen: false });
    await screen.findByText("No conversations yet.");

    const sidebar = screen.getByLabelText("Conversation history");
    expect(sidebar).toHaveClass("-translate-x-full");
  });

  it("mostra o drawer quando aberto", async () => {
    renderSidebar({ isMobileOpen: true });
    await screen.findByText("No conversations yet.");

    const sidebar = screen.getByLabelText("Conversation history");
    expect(sidebar).toHaveClass("translate-x-0");
    expect(sidebar).not.toHaveClass("-translate-x-full");
  });

  it("fecha pelo botao de fechar do drawer", async () => {
    const user = userEvent.setup();
    const props = renderSidebar({ isMobileOpen: true });
    await screen.findByText("No conversations yet.");

    await user.click(
      screen.getByRole("button", { name: "Close conversation history" }),
    );

    expect(props.onCloseMobile).toHaveBeenCalledTimes(1);
  });

  it("fecha pelo backdrop", async () => {
    const user = userEvent.setup();
    const props = renderSidebar({ isMobileOpen: true });
    await screen.findByText("No conversations yet.");

    await user.click(
      screen.getByRole("button", {
        name: "Close conversation history overlay",
      }),
    );

    expect(props.onCloseMobile).toHaveBeenCalledTimes(1);
  });
});
