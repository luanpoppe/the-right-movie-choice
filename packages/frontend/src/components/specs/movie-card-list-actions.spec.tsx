import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useUserMovieEntries } from "@/features/movies/context/use-user-movie-entries.hook";
import { MovieCardListActions } from "../movie-card-list-actions";

jest.mock("lucide-react", () => ({
  Bookmark: () => <span data-testid="icon-bookmark" />,
  Eye: () => <span data-testid="icon-eye" />,
  Heart: () => <span data-testid="icon-heart" />,
  Loader2: () => <span data-testid="icon-loader" />,
  X: () => <span data-testid="icon-x" />,
}));

jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/features/movies/context/use-user-movie-entries.hook", () => ({
  useUserMovieEntries: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseUserMovieEntries = jest.mocked(useUserMovieEntries);

const WATCHED_AT_ISO = "2026-03-15T00:00:00.000Z";

interface Flags {
  watched: boolean;
  favorite: boolean;
  inWatchlist: boolean;
  rating: number | null;
  watchedAt: string | null;
}

const DEFAULT_FLAGS: Flags = {
  watched: false,
  favorite: false,
  inWatchlist: false,
  rating: null,
  watchedAt: null,
};

function renderActions(tmdbId = 27205) {
  return render(
    <MemoryRouter>
      <MovieCardListActions tmdbId={tmdbId} />
    </MemoryRouter>,
  );
}

describe("MovieCardListActions", () => {
  const patchEntry = jest.fn();
  const getFlags = jest.fn();
  const hasEntry = jest.fn();
  const getWatchedUndo = jest.fn();
  const startWatchedUndo = jest.fn();
  const cancelWatchedUndo = jest.fn();
  const undoWatchedDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      accessToken: "token",
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });
    getFlags.mockReturnValue({ ...DEFAULT_FLAGS });
    hasEntry.mockReturnValue(false);
    patchEntry.mockResolvedValue(true);
    getWatchedUndo.mockReturnValue(null);
    undoWatchedDelete.mockResolvedValue(undefined);
    mockedUseUserMovieEntries.mockReturnValue({
      getFlags,
      hasEntry,
      patchEntry,
      isLoading: false,
      isPatching: () => false,
      getWatchedUndo,
      startWatchedUndo,
      cancelWatchedUndo,
      undoWatchedDelete,
    });
  });

  function mockFlags(overrides: Partial<Flags>): void {
    getFlags.mockReturnValue({ ...DEFAULT_FLAGS, ...overrides });
  }

  describe("visitante", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        accessToken: null,
        setAccessToken: jest.fn(),
        clearSession: jest.fn(),
      });
    });

    it("mostra CTA de login/registro e não chama patchEntry", () => {
      renderActions();

      expect(
        screen.getByText("Save your lists by creating an account:"),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
        "href",
        "/login?redirect=%2F",
      );
      expect(
        screen.getByRole("link", { name: "Create account" }),
      ).toHaveAttribute("href", "/register");
      expect(patchEntry).not.toHaveBeenCalled();
    });

    it("edge: CTA preserva a URL atual em ?redirect=", () => {
      render(
        <MemoryRouter initialEntries={["/search?query=Interstellar&page=2"]}>
          <MovieCardListActions tmdbId={27205} />
        </MemoryRouter>,
      );

      expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
        "href",
        "/login?redirect=%2Fsearch%3Fquery%3DInterstellar%26page%3D2",
      );
    });
  });

  describe("usuário autenticado", () => {
    it("alterna favorito e envia PATCH com favorite true", async () => {
      const user = userEvent.setup();
      renderActions(27205);

      await user.click(screen.getByRole("button", { name: "Favorite" }));

      expect(patchEntry).toHaveBeenCalledWith(27205, { favorite: true });
    });

    it("alterna watchlist e envia PATCH com inWatchlist true", async () => {
      const user = userEvent.setup();
      renderActions(550);

      await user.click(screen.getByRole("button", { name: "Watchlist" }));

      expect(patchEntry).toHaveBeenCalledWith(550, { inWatchlist: true });
    });

    it("exibe favorito ativo quando getFlags retorna favorite true", () => {
      mockFlags({ favorite: true });

      renderActions(27205);

      expect(
        screen.getByRole("button", { name: "Favorite" }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    it("exibe loading enquanto hidrata as listas do usuário", () => {
      mockedUseUserMovieEntries.mockReturnValue({
        getFlags,
        hasEntry,
        patchEntry,
        isLoading: true,
        isPatching: () => false,
        getWatchedUndo,
        startWatchedUndo,
        cancelWatchedUndo,
        undoWatchedDelete,
      });

      renderActions(27205);

      expect(screen.getByRole("status")).toHaveTextContent(
        "Loading your lists...",
      );
      expect(
        screen.queryByRole("button", { name: "Favorite" }),
      ).not.toBeInTheDocument();
      expect(getFlags).not.toHaveBeenCalled();
    });

    it("Watched em filme não assistido abre a modal de criação", async () => {
      const user = userEvent.setup();
      renderActions(157336);

      await user.click(screen.getByRole("button", { name: "Watched" }));

      expect(
        screen.getByRole("heading", { name: "Mark as watched" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Delete" }),
      ).not.toBeInTheDocument();
      expect(patchEntry).not.toHaveBeenCalled();
    });

    it("REQ-1: Watched em filme já assistido abre a modal em modo edição", async () => {
      mockFlags({ watched: true, rating: 8, watchedAt: WATCHED_AT_ISO });
      const user = userEvent.setup();
      renderActions(157336);

      await user.click(screen.getByRole("button", { name: "Watched" }));

      expect(
        screen.getByRole("heading", { name: "Watched" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Rating (1–10)")).toHaveValue(8);
      expect(screen.getByLabelText("Date watched")).toHaveValue("2026-03-15");
      expect(
        screen.getByRole("button", { name: "Delete" }),
      ).toBeInTheDocument();
      expect(patchEntry).not.toHaveBeenCalled();
    });
  });

  describe("desfazer o delete (REQ-5)", () => {
    async function deleteWatchedEntry(
      user: ReturnType<typeof userEvent.setup>,
    ): Promise<void> {
      mockFlags({ watched: true, rating: 8, watchedAt: WATCHED_AT_ISO });
      renderActions(157336);

      await user.click(screen.getByRole("button", { name: "Watched" }));
      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(patchEntry).toHaveBeenCalledWith(157336, {
        watched: false,
        rating: null,
        watchedAt: null,
      });
      expect(startWatchedUndo).toHaveBeenCalledWith(157336, {
        rating: 8,
        watchedAt: WATCHED_AT_ISO,
      });
    }

    it("delete inicia a janela de undo no provider com o snapshot da entrada", async () => {
      const user = userEvent.setup();

      await deleteWatchedEntry(user);
    });

    it("mostra a barra Undo enquanto o provider mantém a janela", () => {
      getWatchedUndo.mockReturnValue({ rating: 8, watchedAt: WATCHED_AT_ISO });

      renderActions(157336);

      expect(screen.getByText("Watched removed")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    });

    it("clicar em Undo delega a restauração ao provider", async () => {
      getWatchedUndo.mockReturnValue({ rating: 8, watchedAt: WATCHED_AT_ISO });
      const user = userEvent.setup();
      renderActions(157336);

      await user.click(screen.getByRole("button", { name: "Undo" }));

      expect(undoWatchedDelete).toHaveBeenCalledWith(157336);
    });

    it("edge: outra ação no card cancela o desfazer no provider", async () => {
      getWatchedUndo.mockReturnValue({ rating: 8, watchedAt: WATCHED_AT_ISO });
      const user = userEvent.setup();
      renderActions(157336);

      await user.click(screen.getByRole("button", { name: "Favorite" }));

      expect(cancelWatchedUndo).toHaveBeenCalledWith(157336);
      expect(patchEntry).toHaveBeenCalledWith(157336, { favorite: true });
    });
  });
});
