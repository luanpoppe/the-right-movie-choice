import { act, renderHook, waitFor } from "@testing-library/react";
import { PropsWithChildren } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { UserMovieEntryEntity } from "../../entities/user-movie-entry.entity";
import { UserMovieEntryService } from "../../services/user-movie-entry.service";
import { UserMovieEntriesProvider } from "../user-movie-entries.context";
import { useUserMovieEntries } from "../use-user-movie-entries.hook";

jest.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../services/user-movie-entry.service", () => ({
  UserMovieEntryService: {
    listEntries: jest.fn(),
    patchEntry: jest.fn(),
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedListEntries = jest.mocked(UserMovieEntryService.listEntries);
const mockedPatchEntry = jest.mocked(UserMovieEntryService.patchEntry);
const mockedToastError = jest.mocked(toast.error);

class UserMovieEntriesContextFixtures {
  static entry(
    overrides: Partial<UserMovieEntryEntity> = {},
  ): UserMovieEntryEntity {
    return {
      tmdbId: 27205,
      movieId: 1,
      watched: false,
      favorite: true,
      inWatchlist: false,
      rating: null,
      watchedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      ...overrides,
    };
  }

  static wrapper() {
    return function Wrapper({ children }: PropsWithChildren) {
      return (
        <UserMovieEntriesProvider>{children}</UserMovieEntriesProvider>
      );
    };
  }
}

describe("UserMovieEntriesProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      accessToken: "token",
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });
    mockedListEntries.mockResolvedValue([]);
  });

  it("REQ-9: getFlags reflete entrada hidratada (favorito ativo)", async () => {
    const favoriteEntry = UserMovieEntriesContextFixtures.entry({
      tmdbId: 27205,
      favorite: true,
    });
    mockedListEntries.mockResolvedValue([favoriteEntry]);

    const { result } = renderHook(() => useUserMovieEntries(), {
      wrapper: UserMovieEntriesContextFixtures.wrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const flags27205 = result.current.getFlags(27205);
    const flags550 = result.current.getFlags(550);

    expect(flags27205.favorite).toBe(true);
    expect(flags550).toEqual({
      watched: false,
      favorite: false,
      inWatchlist: false,
      rating: null,
      watchedAt: null,
    });
  });

  it("limpa entradas quando usuário não está autenticado", async () => {
    mockedUseAuth.mockReturnValue({
      accessToken: null,
      setAccessToken: jest.fn(),
      clearSession: jest.fn(),
    });

    const { result } = renderHook(() => useUserMovieEntries(), {
      wrapper: UserMovieEntriesContextFixtures.wrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedListEntries).not.toHaveBeenCalled();
    expect(result.current.getFlags(27205).favorite).toBe(false);
  });

  it("REQ-1: patchEntry envia favorito e atualiza flags após resposta", async () => {
    const serverEntry = UserMovieEntriesContextFixtures.entry({
      tmdbId: 27205,
      favorite: true,
    });
    mockedPatchEntry.mockResolvedValue(serverEntry);

    const { result } = renderHook(() => useUserMovieEntries(), {
      wrapper: UserMovieEntriesContextFixtures.wrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.patchEntry(27205, { favorite: true });
    });

    expect(mockedPatchEntry).toHaveBeenCalledWith(27205, { favorite: true });
    expect(result.current.getFlags(27205).favorite).toBe(true);
  });

  it("REQ-10: falha de PATCH reverte estado otimista e exibe toast", async () => {
    const existingEntry = UserMovieEntriesContextFixtures.entry({
      tmdbId: 27205,
      favorite: false,
    });
    mockedListEntries.mockResolvedValue([existingEntry]);
    mockedPatchEntry.mockRejectedValue(new Error("500"));

    const { result } = renderHook(() => useUserMovieEntries(), {
      wrapper: UserMovieEntriesContextFixtures.wrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.patchEntry(27205, { favorite: true });
    });

    expect(result.current.getFlags(27205).favorite).toBe(false);
    expect(mockedToastError).toHaveBeenCalledWith(
      "Unexpected Error. Try again or get in contact with the staff.",
    );
  });

  it("edge: PATCH retorna entry null remove entrada do mapa", async () => {
    const existingEntry = UserMovieEntriesContextFixtures.entry({
      tmdbId: 27205,
      favorite: true,
    });
    mockedListEntries.mockResolvedValue([existingEntry]);
    mockedPatchEntry.mockResolvedValue(null);

    const { result } = renderHook(() => useUserMovieEntries(), {
      wrapper: UserMovieEntriesContextFixtures.wrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.patchEntry(27205, { favorite: false });
    });

    expect(result.current.getFlags(27205).favorite).toBe(false);
    expect(result.current.getFlags(27205).watched).toBe(false);
    expect(result.current.getFlags(27205).inWatchlist).toBe(false);
  });

  it("edge: cliques rápidos ignoram resposta obsoleta", async () => {
    let resolveFirst: (value: UserMovieEntryEntity | null) => void;
    let resolveSecond: (value: UserMovieEntryEntity | null) => void;

    const firstPromise = new Promise<UserMovieEntryEntity | null>((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise<UserMovieEntryEntity | null>((resolve) => {
      resolveSecond = resolve;
    });

    mockedPatchEntry
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const { result } = renderHook(() => useUserMovieEntries(), {
      wrapper: UserMovieEntriesContextFixtures.wrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      void result.current.patchEntry(27205, { favorite: true });
      void result.current.patchEntry(27205, { favorite: false });
    });

    const secondServerEntry = UserMovieEntriesContextFixtures.entry({
      tmdbId: 27205,
      favorite: false,
    });

    await act(async () => {
      resolveSecond!(secondServerEntry);
      await secondPromise;
    });

    await act(async () => {
      const staleEntry = UserMovieEntriesContextFixtures.entry({
        tmdbId: 27205,
        favorite: true,
      });
      resolveFirst!(staleEntry);
      await firstPromise;
    });

    expect(result.current.getFlags(27205).favorite).toBe(false);
  });
});
