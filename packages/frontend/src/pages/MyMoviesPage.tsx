import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router";
import toast from "react-hot-toast";
import { LibraryMovieCard } from "@/components/library-movie-card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/context/AuthContext";
import { UserMovieEntryFlags, UserMovieEntryMergeUtils } from "@/features/movies/context/user-movie-entry-merge.utils";
import { UserMovieEntriesProvider } from "@/features/movies/context/user-movie-entries.context";
import { useUserMovieEntries } from "@/features/movies/context/use-user-movie-entries.hook";
import { UserMovieEntryListFilter } from "@/features/movies/dto/user-movie-entry.dto";
import { UserMovieEntryEntity } from "@/features/movies/entities/user-movie-entry.entity";
import { UserMovieEntryService } from "@/features/movies/services/user-movie-entry.service";
import { StringUtils } from "@/utils/string.utils";

const GENERIC_ERROR_TOAST =
  "Unexpected Error. Try again or get in contact with the staff.";

const MY_MOVIES_LOGIN_REDIRECT = "/login?redirect=/my-movies";

export type MyMoviesTab = "watched" | "watchlist" | "favorites";

export class MyMoviesPageUtils {
  static getTabFilter(tab: MyMoviesTab): UserMovieEntryListFilter {
    if (tab === "watched") {
      return { watched: true };
    }
    if (tab === "watchlist") {
      return { inWatchlist: true };
    }

    return { favorite: true };
  }

  static matchesTab(tab: MyMoviesTab, flags: UserMovieEntryFlags): boolean {
    if (tab === "watched") {
      return flags.watched;
    }
    if (tab === "watchlist") {
      return flags.inWatchlist;
    }

    return flags.favorite;
  }

  static showWatchedDetails(tab: MyMoviesTab): boolean {
    return tab === "watched";
  }

  static getEmptyStateMessage(tab: MyMoviesTab): string {
    if (tab === "watched") {
      return "You haven't marked any movie as watched yet.";
    }
    if (tab === "watchlist") {
      return 'Your "Want to watch" list is empty.';
    }

    return "You haven't favorited any movies yet.";
  }

  static resolveFlagsWithFallback(
    entry: UserMovieEntryEntity,
    getFlags: (tmdbId: number) => UserMovieEntryFlags,
    hasEntry: (tmdbId: number) => boolean,
  ): UserMovieEntryFlags {
    const entryInContext = hasEntry(entry.tmdbId);
    if (entryInContext) {
      return getFlags(entry.tmdbId);
    }

    return UserMovieEntryMergeUtils.toFlags(entry);
  }

  static resolveVisibleFlags(
    entry: UserMovieEntryEntity,
    getFlags: (tmdbId: number) => UserMovieEntryFlags,
    hasEntry: (tmdbId: number) => boolean,
    isProviderLoading: boolean,
  ): UserMovieEntryFlags {
    if (isProviderLoading) {
      return UserMovieEntryMergeUtils.toFlags(entry);
    }

    return MyMoviesPageUtils.resolveFlagsWithFallback(entry, getFlags, hasEntry);
  }
}

function MyMoviesPageContent() {
  const { getFlags, hasEntry, isLoading: isProviderLoading } = useUserMovieEntries();
  const [activeTab, setActiveTab] = useState<MyMoviesTab>("watched");
  const [tabEntries, setTabEntries] = useState<UserMovieEntryEntity[]>([]);
  const [isLoadingTab, setIsLoadingTab] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const activeFetchIdRef = useRef(0);

  const fetchTabEntries = useCallback(async (tab: MyMoviesTab) => {
    const fetchId = activeFetchIdRef.current + 1;
    activeFetchIdRef.current = fetchId;

    const filter = MyMoviesPageUtils.getTabFilter(tab);

    setIsLoadingTab(true);
    setHasLoadError(false);

    console.info("[MyMoviesPage] 🚀 Carregando entradas da aba", { tab, filter });

    try {
      const entries = await UserMovieEntryService.listEntries(filter);
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      setTabEntries(entries);
      console.info("[MyMoviesPage] ✅ Entradas carregadas", {
        tab,
        entryCount: entries.length,
      });
    } catch (error) {
      const isStaleFetch = fetchId !== activeFetchIdRef.current;
      if (isStaleFetch) {
        return;
      }

      console.error("[MyMoviesPage] ❌ Falha ao carregar entradas da aba", {
        tab,
        error,
      });
      setHasLoadError(true);
      toast.error(GENERIC_ERROR_TOAST);
    } finally {
      const isCurrentFetch = fetchId === activeFetchIdRef.current;
      if (isCurrentFetch) {
        setIsLoadingTab(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchTabEntries(activeTab);
  }, [activeTab, fetchTabEntries]);

  function handleTabChange(value: string) {
    setActiveTab(value as MyMoviesTab);
  }

  function handleRetry() {
    fetchTabEntries(activeTab);
  }

  const visibleEntries = tabEntries.filter((entry) => {
    const flags = MyMoviesPageUtils.resolveVisibleFlags(
      entry,
      getFlags,
      hasEntry,
      isProviderLoading,
    );
    const matchesTab = MyMoviesPageUtils.matchesTab(activeTab, flags);
    return matchesTab;
  });

  const showWatchedDetails = MyMoviesPageUtils.showWatchedDetails(activeTab);
  const emptyStateMessage = MyMoviesPageUtils.getEmptyStateMessage(activeTab);
  const isPageLoading = isLoadingTab || isProviderLoading;
  const hasVisibleEntries = visibleEntries.length > 0;
  const shouldShowEmptyState =
    !isPageLoading && !hasLoadError && !hasVisibleEntries;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">My movies</h1>
        <p className="text-muted-foreground">
          Manage your watched movies, watchlist, and favorites.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="watched">Watched</TabsTrigger>
          <TabsTrigger value="watchlist">Want to watch</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isPageLoading && (
            <p className="text-center text-muted-foreground">Loading...</p>
          )}

          {hasLoadError && !isPageLoading && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-muted-foreground">
                Could not load your movies.
              </p>
              <Button type="button" variant="outline" onClick={handleRetry}>
                Try again
              </Button>
            </div>
          )}

          {shouldShowEmptyState && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-muted-foreground">{emptyStateMessage}</p>
              <Link
                to="/"
                className="text-primary hover:underline"
              >
                Get recommendations in chat
              </Link>
            </div>
          )}

          {hasVisibleEntries && !isPageLoading && !hasLoadError && (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {visibleEntries.map((entry) => (
                <LibraryMovieCard
                  key={entry.tmdbId}
                  entry={entry}
                  showWatchedDetails={showWatchedDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function MyMoviesPage() {
  const { accessToken } = useAuth();
  const hasAccessToken = !StringUtils.isEmptyString(accessToken);

  if (!hasAccessToken) {
    return <Navigate to={MY_MOVIES_LOGIN_REDIRECT} replace />;
  }

  return (
    <UserMovieEntriesProvider>
      <MyMoviesPageContent />
    </UserMovieEntriesProvider>
  );
}
