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

jest.mock("@/features/conversations/services/user-conversation.service", () => ({
  UserConversationService: {
    create: jest.fn(),
    delete: jest.fn(),
  },
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

const mockedNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual<typeof import("react-router")>("react-router"),
  useNavigate: () => mockedNavigate,
}));

jest.mock("@/features/welcome", () => {
  const { ExcludeWatchedToggle } = jest.requireActual<
    typeof import("@/features/chat/components/ExcludeWatchedToggle")
  >("@/features/chat/components/ExcludeWatchedToggle");

  return {
    Welcome: ({
      handleSubmit,
      isLoading,
      excludeWatched,
      onExcludeWatchedChange,
      hasAccessToken,
    }: {
      handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
      isLoading: boolean;
      excludeWatched: boolean;
      onExcludeWatchedChange: (value: boolean) => void;
      hasAccessToken: boolean;
    }) => (
      <form onSubmit={handleSubmit} data-testid="welcome-form">
        <ExcludeWatchedToggle
          showToggle={hasAccessToken}
          excludeWatched={excludeWatched}
          onExcludeWatchedChange={onExcludeWatchedChange}
          isLoading={isLoading}
          isGuestLocked={false}
        />
        <input
          name="message"
          placeholder="What kind of movie are you looking for?"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    ),
  };
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { UserConversationService } from "@/features/conversations/services/user-conversation.service";
import { MovieRecommendationService } from "@/features/movies/services/movie-recommendation.service";
import { Home } from "../Home";

const mockedUseAuth = jest.mocked(useAuth);
const mockedCreateConversation = jest.mocked(UserConversationService.create);
const mockedDeleteConversation = jest.mocked(UserConversationService.delete);
const mockedGetRecommendations = jest.mocked(
  MovieRecommendationService.getRecommendations,
);
const mockedToastError = jest.mocked(toast.error);

const createdConversation = {
  id: 42,
  chatId: "11111111-1111-4111-8111-111111111111",
  title: null,
  createdAt: "2026-03-15T12:00:00.000Z",
  updatedAt: "2026-03-15T12:00:00.000Z",
};

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

async function submitWelcomeMessage(message: string) {
  const user = userEvent.setup();
  const input = screen.getByPlaceholderText(
    "What kind of movie are you looking for?",
  );
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

describe("Home authenticated conversation flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Object.defineProperty(globalThis.crypto, "randomUUID", {
      configurable: true,
      value: jest.fn(() => "test-chat-id"),
    });

    mockedUseAuth.mockReturnValue({
      accessToken: "token",
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    mockedCreateConversation.mockResolvedValue(createdConversation);
    mockedDeleteConversation.mockResolvedValue(undefined);
    mockedGetRecommendations.mockResolvedValue(recommendationResponse);

    Object.defineProperty(HTMLFormElement.prototype, "message", {
      configurable: true,
      get() {
        return this.elements.namedItem("message");
      },
    });
  });

  it("REQ-1: usuário autenticado vê apenas Welcome, sem sidebar de conversas", () => {
    renderHome();

    expect(screen.getByTestId("welcome-form")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByText(/new conversation/i)).not.toBeInTheDocument();
  });

  it("REQ-4: cria conversa antes da recommendation e navega para /conversations/:id", async () => {
    renderHome();

    await submitWelcomeMessage("sci-fi thriller");

    await waitFor(() => {
      expect(mockedCreateConversation).toHaveBeenCalledTimes(1);
    });

    expect(mockedGetRecommendations).toHaveBeenCalledWith(
      { userMessage: "sci-fi thriller", excludeWatched: true },
      createdConversation.chatId,
    );
    expect(mockedNavigate).toHaveBeenCalledWith("/conversations/42", {
      state: {
        conversationBootstrap: {
          userMessage: "sci-fi thriller",
          response: recommendationResponse.response,
          movies: recommendationResponse.movies,
        },
      },
    });
  });

  it("edge: falha na recommendation remove conversa órfã e não navega", async () => {
    mockedGetRecommendations.mockRejectedValue(new Error("recommendation failed"));

    renderHome();
    await submitWelcomeMessage("should rollback");

    await waitFor(() => {
      expect(mockedDeleteConversation).toHaveBeenCalledWith(42);
    });

    expect(mockedToastError).toHaveBeenCalled();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it("REQ-4: create é chamado antes de getRecommendations", async () => {
    const callOrder: string[] = [];

    mockedCreateConversation.mockImplementation(async () => {
      callOrder.push("create");
      return createdConversation;
    });

    mockedGetRecommendations.mockImplementation(async () => {
      callOrder.push("recommendation");
      return recommendationResponse;
    });

    renderHome();
    await submitWelcomeMessage("order check");

    await waitFor(() => {
      expect(callOrder).toEqual(["create", "recommendation"]);
    });
  });

  it("edge: falha no POST /movie/conversations não chama recommendation e exibe toast", async () => {
    mockedCreateConversation.mockRejectedValue(new Error("create failed"));

    renderHome();
    await submitWelcomeMessage("should fail");

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Unexpected Error. Try again or get in contact with the staff.",
      );
    });

    expect(mockedGetRecommendations).not.toHaveBeenCalled();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });
});
