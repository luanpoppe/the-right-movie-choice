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

  beforeEach(() => {
    jest.clearAllMocks();
    getFlags.mockReturnValue({
      watched: false,
      favorite: false,
      inWatchlist: false,
      rating: null,
      watchedAt: null,
    });
    patchEntry.mockResolvedValue(true);
    mockedUseUserMovieEntries.mockReturnValue({
      getFlags,
      patchEntry,
      isLoading: false,
      isPatching: () => false,
    });
  });

  it("REQ-7: visitante anônimo vê CTA de login e não chama patchEntry", async () => {
    mockedUseAuth.mockReturnValue({
      accessToken: null,
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    renderActions();

    expect(
      screen.getByText("Salve suas listas criando uma conta:"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(patchEntry).not.toHaveBeenCalled();
  });

  describe("usuário autenticado", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        accessToken: "token",
        setAccessToken: jest.fn(),
        clearSession: jest.fn(),
      });
    });

    it("REQ-1: alterna favorito e envia PATCH com favorite true", async () => {
      const user = userEvent.setup();
      renderActions(27205);

      await user.click(screen.getByRole("button", { name: "Favorito" }));

      expect(patchEntry).toHaveBeenCalledWith(27205, { favorite: true });
    });

    it("REQ-2: alterna watchlist e envia PATCH com inWatchlist true", async () => {
      const user = userEvent.setup();
      renderActions(550);

      await user.click(screen.getByRole("button", { name: "Watchlist" }));

      expect(patchEntry).toHaveBeenCalledWith(550, { inWatchlist: true });
    });

    it("REQ-3: marcar assistido abre modal sem enviar PATCH", async () => {
      const user = userEvent.setup();
      renderActions(157336);

      await user.click(screen.getByRole("button", { name: "Assistido" }));

      expect(
        screen.getByRole("heading", { name: "Marcar como assistido" }),
      ).toBeInTheDocument();
      expect(patchEntry).not.toHaveBeenCalled();
    });

    it("REQ-6: desmarcar assistido envia PATCH watched false sem abrir modal", async () => {
      getFlags.mockReturnValue({
        watched: true,
        favorite: false,
        inWatchlist: false,
        rating: null,
        watchedAt: null,
      });

      const user = userEvent.setup();
      renderActions(157336);

      await user.click(screen.getByRole("button", { name: "Assistido" }));

      expect(patchEntry).toHaveBeenCalledWith(157336, { watched: false });
      expect(
        screen.queryByRole("heading", { name: "Marcar como assistido" }),
      ).not.toBeInTheDocument();
    });

    it("REQ-9: exibe favorito ativo quando getFlags retorna favorite true", () => {
      getFlags.mockReturnValue({
        watched: false,
        favorite: true,
        inWatchlist: false,
        rating: null,
        watchedAt: null,
      });

      renderActions(27205);

      const favoriteButton = screen.getByRole("button", { name: "Favorito" });
      expect(favoriteButton).toHaveAttribute("aria-pressed", "true");
    });

    it("exibe loading enquanto hidrata as listas do usuário", () => {
      mockedUseUserMovieEntries.mockReturnValue({
        getFlags,
        patchEntry,
        isLoading: true,
        isPatching: () => false,
      });

      renderActions(27205);

      expect(screen.getByRole("status")).toHaveTextContent(
        "Carregando suas listas...",
      );
      expect(
        screen.queryByRole("button", { name: "Favorito" }),
      ).not.toBeInTheDocument();
      expect(getFlags).not.toHaveBeenCalled();
    });
  });
});
