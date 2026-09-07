jest.mock("lucide-react", () => ({
  Send: () => <span data-testid="send-icon" />,
}));

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ChatForm } from "../ChatForm";

function renderChatForm(
  overrides: Partial<{
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
    isGuestLocked: boolean;
    excludeWatched: boolean;
    onExcludeWatchedChange: (value: boolean) => void;
    hasAccessToken: boolean;
  }> = {},
) {
  const props = {
    handleSubmit: jest.fn(),
    isLoading: false,
    isGuestLocked: false,
    excludeWatched: true,
    onExcludeWatchedChange: jest.fn(),
    hasAccessToken: false,
    ...overrides,
  };

  return render(
    <MemoryRouter>
      <ChatForm {...props} />
    </MemoryRouter>,
  );
}

function getExcludeWatchedCheckbox() {
  return screen.getByRole("checkbox", { name: /exclude watched movies/i });
}

describe("ChatForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("REQ-1: usuário autenticado vê toggle ligado por padrão", () => {
    renderChatForm({ hasAccessToken: true, excludeWatched: true });

    const checkbox = getExcludeWatchedCheckbox();
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it("REQ-2: visitante anônimo não vê o toggle", () => {
    renderChatForm({ hasAccessToken: false });

    expect(
      screen.queryByRole("checkbox", { name: /exclude watched movies/i }),
    ).not.toBeInTheDocument();
  });

  it("REQ-7: toggle desabilitado durante isLoading", () => {
    renderChatForm({ hasAccessToken: true, isLoading: true });

    expect(getExcludeWatchedCheckbox()).toBeDisabled();
  });

  it("edge guest lock: toggle desabilitado quando isGuestLocked é true", () => {
    renderChatForm({
      hasAccessToken: true,
      isGuestLocked: true,
      excludeWatched: true,
    });

    expect(getExcludeWatchedCheckbox()).toBeDisabled();
  });
});
