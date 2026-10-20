jest.mock("@/features/movies/services/movies-query-examples.service", () => ({
  MoviesQueryExamplesService: {
    getQueryExamples: jest.fn().mockResolvedValue({ queries: [] }),
  },
}));

jest.mock("lucide-react", () => ({
  Send: () => <span data-testid="send-icon" />,
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MoviesQueryExamplesService } from "@/features/movies/services/movies-query-examples.service";
import { Form } from "../Form";

const SUGGESTION_TEXT = "mind-bending sci-fi thriller";

const mockedGetQueryExamples = jest.mocked(
  MoviesQueryExamplesService.getQueryExamples,
);

function renderWelcomeForm(
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
      <Form {...props} />
    </MemoryRouter>,
  );
}

function getExcludeWatchedCheckbox() {
  return screen.getByRole("checkbox", { name: /exclude watched movies/i });
}

describe("Welcome Form", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetQueryExamples.mockResolvedValue({
      queries: [{ queryExample: SUGGESTION_TEXT }],
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  function mockViewport(isDesktop: boolean) {
    window.matchMedia = jest.fn().mockReturnValue({
      matches: isDesktop,
    }) as never;
  }

  async function findSuggestionButton() {
    return screen.findByRole("button", { name: SUGGESTION_TEXT });
  }

  it("não foca o textarea automaticamente no mobile", () => {
    mockViewport(false);
    renderWelcomeForm();

    expect(screen.getByRole("textbox")).not.toHaveFocus();
  });

  it("foca o textarea automaticamente no desktop", () => {
    mockViewport(true);
    renderWelcomeForm();

    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("preenche o textarea com a sugestão clicada e mantém o foco nele", async () => {
    const user = userEvent.setup();
    renderWelcomeForm();

    const suggestionButton = await findSuggestionButton();
    await user.click(suggestionButton);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue(SUGGESTION_TEXT);
    expect(textarea).toHaveFocus();
  });

  it("não preenche o textarea quando o guest lock está ativo", async () => {
    const user = userEvent.setup();
    renderWelcomeForm({ isGuestLocked: true });

    const suggestionButton = await findSuggestionButton();
    expect(suggestionButton).toBeDisabled();
    await user.click(suggestionButton);

    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("REQ-1: usuário autenticado vê toggle ligado por padrão", () => {
    renderWelcomeForm({ hasAccessToken: true, excludeWatched: true });

    const checkbox = getExcludeWatchedCheckbox();
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it("REQ-2: visitante anônimo não vê o toggle", () => {
    renderWelcomeForm({ hasAccessToken: false });

    expect(
      screen.queryByRole("checkbox", { name: /exclude watched movies/i }),
    ).not.toBeInTheDocument();
  });

  it("REQ-7: toggle desabilitado durante isLoading", () => {
    renderWelcomeForm({ hasAccessToken: true, isLoading: true });

    expect(getExcludeWatchedCheckbox()).toBeDisabled();
  });

  it("edge guest lock: toggle desabilitado quando isGuestLocked é true", () => {
    renderWelcomeForm({
      hasAccessToken: true,
      isGuestLocked: true,
      excludeWatched: true,
    });

    expect(getExcludeWatchedCheckbox()).toBeDisabled();
  });
});
