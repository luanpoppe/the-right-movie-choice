import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format } from "date-fns";
import { useUserMovieEntries } from "@/features/movies/context/use-user-movie-entries.hook";
import { MovieCardWatchedModal } from "../movie-card-watched-modal";

jest.mock("lucide-react", () => ({
  X: () => <span data-testid="icon-x" />,
  Star: () => <span data-testid="icon-star" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronLeft: () => <span data-testid="icon-chevron-left" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
}));

jest.mock("@/features/movies/context/use-user-movie-entries.hook", () => ({
  useUserMovieEntries: jest.fn(),
}));

const mockedUseUserMovieEntries = jest.mocked(useUserMovieEntries);

interface Flags {
  watched: boolean;
  favorite: boolean;
  inWatchlist: boolean;
  rating: number | null;
  watchedAt: string | null;
}

const CREATION_FLAGS: Flags = {
  watched: false,
  favorite: false,
  inWatchlist: false,
  rating: null,
  watchedAt: null,
};

function getDayButton(dayNumber: string): HTMLElement {
  const dayButton = screen
    .getAllByRole("button")
    .find((button) => button.textContent === dayNumber);

  if (!dayButton) {
    throw new Error(`Day button "${dayNumber}" not found`);
  }

  return dayButton;
}

describe("MovieCardWatchedModal", () => {
  const patchEntry = jest.fn();
  const getFlags = jest.fn();
  const onOpenChange = jest.fn();
  const onDeleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getFlags.mockReturnValue({ ...CREATION_FLAGS });
    patchEntry.mockResolvedValue(true);
    mockedUseUserMovieEntries.mockReturnValue({
      getFlags,
      hasEntry: jest.fn(),
      patchEntry,
      isLoading: false,
      isPatching: () => false,
    });
  });

  function mockEditingFlags(overrides: Partial<Flags> = {}): void {
    getFlags.mockReturnValue({
      watched: true,
      favorite: false,
      inWatchlist: false,
      rating: 8,
      watchedAt: "2026-03-15",
      ...overrides,
    });
  }

  function renderModal() {
    return render(
      <MovieCardWatchedModal
        tmdbId={157336}
        open
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />,
    );
  }

  describe("REQ-1: modal pré-carregada no modo edição", () => {
    it("abre com a estrela da nota acesa, a data e o botão Delete", () => {
      mockEditingFlags();

      renderModal();

      expect(
        screen.getByRole("heading", { name: "Watched" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: "8 of 10 stars" }),
      ).toBeChecked();
      expect(screen.getByText("March 15th, 2026")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Delete" }),
      ).toBeInTheDocument();
    });

    it("REQ-7: nota e data nulas aparecem como não informadas", () => {
      mockEditingFlags({ rating: null, watchedAt: null });

      renderModal();

      expect(screen.getByText("Not rated")).toBeInTheDocument();
      expect(
        screen
          .getAllByRole("radio")
          .some((radio) => (radio as HTMLInputElement).checked),
      ).toBe(false);
      expect(screen.getByText("Pick a date")).toBeInTheDocument();
    });

    it("REQ-7: data ISO com hora é exibida só com o dia", () => {
      mockEditingFlags({ watchedAt: "2026-03-15T03:00:00.000Z" });

      renderModal();

      expect(screen.getByText("March 15th, 2026")).toBeInTheDocument();
    });
  });

  it("REQ-2: atualizar a nota envia PATCH e fecha a modal", async () => {
    const user = userEvent.setup();
    mockEditingFlags();
    renderModal();

    await user.click(screen.getByRole("radio", { name: "9 of 10 stars" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(patchEntry).toHaveBeenCalledWith(157336, {
        watched: true,
        rating: 9,
        watchedAt: "2026-03-15T00:00:00.000Z",
      });
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("REQ-3: limpar nota e data zera os valores no PATCH", async () => {
    const user = userEvent.setup();
    mockEditingFlags();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.click(screen.getByRole("button", { name: "Clear date" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(patchEntry).toHaveBeenCalledWith(157336, {
        watched: true,
        rating: null,
        watchedAt: null,
      });
    });
  });

  it("REQ-4: Delete envia PATCH removendo watched e notifica onDeleted", async () => {
    const user = userEvent.setup();
    mockEditingFlags();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(patchEntry).toHaveBeenCalledWith(157336, {
        watched: false,
        rating: null,
        watchedAt: null,
      });
    });
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  describe("modo criação", () => {
    it("confirmar sem nota nem data envia apenas watched true", async () => {
      const user = userEvent.setup();
      renderModal();

      expect(
        screen.getByRole("heading", { name: "Mark as watched" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Delete" }),
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Confirm" }));

      await waitFor(() => {
        expect(patchEntry).toHaveBeenCalledWith(157336, { watched: true });
      });
    });

    it("confirmar com nota e data envia PATCH completo", async () => {
      const user = userEvent.setup();
      renderModal();

      const today = new Date();
      const expectedWatchedAt = `${format(
        new Date(today.getFullYear(), today.getMonth(), 15),
        "yyyy-MM-dd",
      )}T00:00:00.000Z`;

      await user.click(screen.getByRole("radio", { name: "8 of 10 stars" }));
      await user.click(screen.getByText("Pick a date"));
      await user.click(getDayButton("15"));
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      await waitFor(() => {
        expect(patchEntry).toHaveBeenCalledWith(157336, {
          watched: true,
          rating: 8,
          watchedAt: expectedWatchedAt,
        });
      });
    });

    it("cancelar não envia PATCH", async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(patchEntry).not.toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("rollback otimista em falha de PATCH", () => {
    it("save com falha mantém a modal aberta", async () => {
      const user = userEvent.setup();
      mockEditingFlags();
      patchEntry.mockResolvedValue(false);
      renderModal();

      await user.click(screen.getByRole("radio", { name: "9 of 10 stars" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(patchEntry).toHaveBeenCalledTimes(1);
      });
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });

    it("delete com falha mantém a modal aberta e não notifica onDeleted", async () => {
      const user = userEvent.setup();
      mockEditingFlags();
      patchEntry.mockResolvedValue(false);
      renderModal();

      await user.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() => {
        expect(patchEntry).toHaveBeenCalledTimes(1);
      });
      expect(onDeleted).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });
});
