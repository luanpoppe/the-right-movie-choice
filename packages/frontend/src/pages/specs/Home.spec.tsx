jest.mock("@/utils/env", () => ({
  env: {
    VITE_BACKEND_URL: "http://backend.test",
    VITE_GOOGLE_CLIENT_ID: "test-google-client-id",
    VITE_NODE_ENV: "test",
  },
}));

jest.mock("lucide-react", () => ({
  Send: () => <span />,
  RotateCcw: () => <span />,
  Film: () => <span />,
  Sparkles: () => <span />,
  MessageSquare: () => <span />,
  Zap: () => <span />,
  Star: () => <span />,
  Calendar: () => <span />,
}));

jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/features/movies/services/movie-recommendation.service", () => ({
  MovieRecommendationService: {
    getRecommendations: jest.fn(),
  },
}));

jest.mock("@/features/movies/services/movies-query-examples.service", () => ({
  MoviesQueryExamplesService: {
    getQueryExamples: jest.fn().mockResolvedValue({ queries: [] }),
  },
}));

jest.mock("@/features/movies/services/user-movie-entry.service", () => ({
  UserMovieEntryService: {
    listEntries: jest.fn().mockResolvedValue([]),
    patchEntry: jest.fn(),
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("@/features/welcome", () => {
  const { ExcludeWatchedToggle } = jest.requireActual<
    typeof import("@/features/chat/components/ExcludeWatchedToggle")
  >("@/features/chat/components/ExcludeWatchedToggle");

  return {
    Welcome: ({
      handleSubmit,
      isLoading,
      isGuestLocked = false,
      excludeWatched,
      onExcludeWatchedChange,
      hasAccessToken,
    }: {
      handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
      isLoading: boolean;
      isGuestLocked?: boolean;
      excludeWatched: boolean;
      onExcludeWatchedChange: (value: boolean) => void;
      hasAccessToken: boolean;
    }) => {
      const isDisabled = isLoading || isGuestLocked;

      return (
        <form onSubmit={handleSubmit} data-testid="welcome-form">
          <ExcludeWatchedToggle
            showToggle={hasAccessToken}
            excludeWatched={excludeWatched}
            onExcludeWatchedChange={onExcludeWatchedChange}
            isLoading={isLoading}
            isGuestLocked={isGuestLocked}
          />
          <input
            name="message"
            placeholder="What kind of movie are you looking for?"
            disabled={isDisabled}
          />
          <button type="submit" disabled={isDisabled}>Send</button>
        </form>
      );
    },
  };
});

jest.mock("@/features/chat", () => {
  const { ExcludeWatchedToggle } = jest.requireActual<
    typeof import("@/features/chat/components/ExcludeWatchedToggle")
  >("@/features/chat/components/ExcludeWatchedToggle");

  return {
    Chat: ({
      handleReset,
      handleSubmit,
      isLoading,
      isGuestLocked = false,
      excludeWatched,
      onExcludeWatchedChange,
      hasAccessToken,
    }: {
      handleReset: () => void;
      handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
      isLoading: boolean;
      isGuestLocked?: boolean;
      excludeWatched: boolean;
      onExcludeWatchedChange: (value: boolean) => void;
      hasAccessToken: boolean;
    }) => {
      const isDisabled = isLoading || isGuestLocked;

      return (
        <div data-testid="chat-view">
          <button type="button" onClick={handleReset}>Start Again</button>
          <form onSubmit={handleSubmit} data-testid="chat-form">
            <ExcludeWatchedToggle
              showToggle={hasAccessToken}
              excludeWatched={excludeWatched}
              onExcludeWatchedChange={onExcludeWatchedChange}
              isLoading={isLoading}
              isGuestLocked={isGuestLocked}
            />
            <input
              name="message"
              placeholder="Describe the type of movie you want to watch..."
              disabled={isDisabled}
            />
            <button type="submit" disabled={isDisabled}>Send</button>
          </form>
        </div>
      );
    },
  };
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { MovieRecommendationService } from "@/features/movies/services/movie-recommendation.service";
import { Home } from "../Home";

const mockedUseAuth = jest.mocked(useAuth);
const mockedGetRecommendations = jest.mocked(
  MovieRecommendationService.getRecommendations,
);

const recommendationResponse = {
  movies: [],
  response: "Here are some movies.",
  guestRemaining: null,
};

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

function getExcludeWatchedCheckbox() {
  return screen.getByRole("checkbox", { name: /exclude watched movies/i });
}

function getMessageInput() {
  return screen.getByPlaceholderText("What kind of movie are you looking for?");
}

async function submitWelcomeMessage(message: string) {
  const user = userEvent.setup();
  const input = getMessageInput();
  const form = input.closest("form");

  if (!form) {
    throw new Error("Formulário da welcome não encontrado");
  }

  const submitButton = form.querySelector('button[type="submit"]');

  if (!submitButton) {
    throw new Error("Botão submit da welcome não encontrado");
  }

  await user.type(input, message);
  await user.click(submitButton);
}

describe("Home exclude-watched toggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetRecommendations.mockResolvedValue(recommendationResponse);

    Object.defineProperty(globalThis.crypto, "randomUUID", {
      configurable: true,
      value: jest.fn(() => "test-chat-id"),
    });

    Object.defineProperty(HTMLFormElement.prototype, "message", {
      configurable: true,
      get() {
        return this.elements.namedItem("message");
      },
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

    it("REQ-1: exibe toggle ligado na welcome", () => {
      renderHome();

      const checkbox = getExcludeWatchedCheckbox();
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });

    it("REQ-1: exibe toggle ligado no chat após iniciar conversa", async () => {
      renderHome();

      await submitWelcomeMessage("sci-fi thriller");

      await waitFor(() => {
        expect(mockedGetRecommendations).toHaveBeenCalled();
      });

      const checkbox = getExcludeWatchedCheckbox();
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });

    it("REQ-3: envia excludeWatched true com toggle ligado", async () => {
      renderHome();

      await submitWelcomeMessage("sci-fi thriller");

      await waitFor(() => {
        expect(mockedGetRecommendations).toHaveBeenCalledWith(
          { userMessage: "sci-fi thriller", excludeWatched: true },
          expect.any(String),
        );
      });
    });

    it("REQ-4: envia excludeWatched false após desligar o toggle", async () => {
      const user = userEvent.setup();
      renderHome();

      await user.click(getExcludeWatchedCheckbox());
      await submitWelcomeMessage("comedy night");

      await waitFor(() => {
        expect(mockedGetRecommendations).toHaveBeenCalledWith(
          { userMessage: "comedy night", excludeWatched: false },
          expect.any(String),
        );
      });
    });

    it("REQ-6: reset restaura toggle ligado na welcome", async () => {
      const user = userEvent.setup();
      renderHome();

      await submitWelcomeMessage("first message");

      await waitFor(() => {
        expect(mockedGetRecommendations).toHaveBeenCalledTimes(1);
      });

      await user.click(getExcludeWatchedCheckbox());
      expect(getExcludeWatchedCheckbox()).not.toBeChecked();

      await user.click(screen.getByRole("button", { name: /start again/i }));

      const checkbox = getExcludeWatchedCheckbox();
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });

    it("REQ-7: toggle desabilitado durante loading", async () => {
      mockedGetRecommendations.mockImplementation(
        () =>
          new Promise(() => {
            /* pendente para manter loading */
          }),
      );

      renderHome();

      await submitWelcomeMessage("slow request");

      await waitFor(() => {
        expect(getExcludeWatchedCheckbox()).toBeDisabled();
      });
    });
  });

  describe("visitante anônimo", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        accessToken: null,
        setAccessToken: jest.fn(),
        clearSession: jest.fn(),
      });
    });

    it("REQ-2: não exibe o toggle na welcome", () => {
      renderHome();

      expect(
        screen.queryByRole("checkbox", { name: /exclude watched movies/i }),
      ).not.toBeInTheDocument();
    });

    it("REQ-2: body do POST não inclui excludeWatched", async () => {
      renderHome();

      await submitWelcomeMessage("anonymous query");

      await waitFor(() => {
        expect(mockedGetRecommendations).toHaveBeenCalledWith(
          { userMessage: "anonymous query" },
          expect.any(String),
        );
      });
    });
  });
});
