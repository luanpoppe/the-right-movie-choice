import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useUserMovieEntries } from "@/features/movies/context/use-user-movie-entries.hook";
import { MovieCardWatchedModal } from "../movie-card-watched-modal";

jest.mock("lucide-react", () => ({
  X: () => <span data-testid="icon-x" />,
}));

jest.mock("@/features/movies/context/use-user-movie-entries.hook", () => ({
  useUserMovieEntries: jest.fn(),
}));

const mockedUseUserMovieEntries = jest.mocked(useUserMovieEntries);

describe("MovieCardWatchedModal", () => {
  const patchEntry = jest.fn();
  const hasEntry = jest.fn();
  const onOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    hasEntry.mockReturnValue(false);
    patchEntry.mockResolvedValue(true);
    mockedUseUserMovieEntries.mockReturnValue({
      getFlags: jest.fn(),
      hasEntry,
      patchEntry,
      isLoading: false,
      isPatching: () => false,
    });
  });

  function renderModal(open = true) {
    return render(
      <MovieCardWatchedModal
        tmdbId={157336}
        open={open}
        onOpenChange={onOpenChange}
      />,
    );
  }

  it("REQ-4: confirmar sem nota nem data envia apenas watched true", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(patchEntry).toHaveBeenCalledWith(157336, { watched: true });
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("REQ-5: confirmar com nota e data envia PATCH completo", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(
      screen.getByLabelText("Rating (1–10)"),
      "8",
    );
    await user.type(
      screen.getByLabelText("Date watched"),
      "2026-03-15",
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(patchEntry).toHaveBeenCalledWith(157336, {
        watched: true,
        rating: 8,
        watchedAt: "2026-03-15T00:00:00.000Z",
      });
    });
  });

  it("edge: confirmar só com nota envia rating sem watchedAt", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Rating (1–10)"), "7");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(patchEntry).toHaveBeenCalledWith(157336, {
        watched: true,
        rating: 7,
      });
    });
    const patchArg = patchEntry.mock.calls[0][1];
    expect(patchArg).not.toHaveProperty("watchedAt");
  });

  it("edge: fechar modal sem confirmar não chama patchEntry", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(patchEntry).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
