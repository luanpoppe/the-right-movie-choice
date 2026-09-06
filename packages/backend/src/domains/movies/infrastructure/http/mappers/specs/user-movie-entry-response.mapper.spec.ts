import { describe, expect, it } from "vitest";
import type {
  UserMovieEntryEntity,
  UserMovieEntryListItemEntity,
} from "@/domains/movies/domain/entities/user-movie-entry.entity";
import { UserMovieEntryResponseMapper } from "../user-movie-entry-response.mapper";
import { TmdbPosterUtils } from "@/modules/tmdb/domain/tmdb-poster.utils";

class UserMovieEntryResponseMapperFixtures {
  static entity(overrides: Partial<UserMovieEntryEntity> = {}): UserMovieEntryEntity {
    return {
      userId: 42,
      tmdbId: 157336,
      movieId: 17,
      watched: true,
      favorite: false,
      inWatchlist: true,
      rating: 9,
      watchedAt: new Date("2024-06-15T20:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      ...overrides,
    };
  }
}

describe("UserMovieEntryResponseMapper", () => {
  it("mapeia entidade para resposta pública com datas em ISO string", () => {
    const entity = UserMovieEntryResponseMapperFixtures.entity();

    const response = UserMovieEntryResponseMapper.toResponse(entity);

    expect(response).toEqual({
      tmdbId: 157336,
      movieId: 17,
      watched: true,
      favorite: false,
      inWatchlist: true,
      rating: 9,
      watchedAt: "2024-06-15T20:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      movie: null,
    });
  });

  it("não expõe userId na resposta pública", () => {
    const entity = UserMovieEntryResponseMapperFixtures.entity();

    const response = UserMovieEntryResponseMapper.toResponse(entity);

    expect(response).not.toHaveProperty("userId");
  });

  it("preserva null em movieId, rating e watchedAt", () => {
    const entity = UserMovieEntryResponseMapperFixtures.entity({
      movieId: null,
      rating: null,
      watchedAt: null,
    });

    const response = UserMovieEntryResponseMapper.toResponse(entity);

    expect(response.movieId).toBeNull();
    expect(response.rating).toBeNull();
    expect(response.watchedAt).toBeNull();
  });

  it("envolve uma entrada em { entry } para GET por tmdbId", () => {
    const entity = UserMovieEntryResponseMapperFixtures.entity();

    const response = UserMovieEntryResponseMapper.toGetEntryResponse(entity);

    expect(response).toEqual({
      entry: UserMovieEntryResponseMapper.toResponse(entity),
    });
  });

  it("envolve lista em { entries }", () => {
    const first = UserMovieEntryResponseMapperFixtures.entity({ tmdbId: 1 });
    const second = UserMovieEntryResponseMapperFixtures.entity({ tmdbId: 2 });

    const response = UserMovieEntryResponseMapper.toListEntriesResponse([
      first,
      second,
    ]);

    expect(response.entries).toHaveLength(2);
    expect(response.entries[0]?.tmdbId).toBe(1);
    expect(response.entries[1]?.tmdbId).toBe(2);
  });

  it("retorna { entry: null } quando PATCH remove a entrada", () => {
    const response = UserMovieEntryResponseMapper.toPatchEntryResponse(null);

    expect(response).toEqual({ entry: null });
  });

  it("retorna { entry } preenchido no PATCH quando a entrada permanece", () => {
    const entity = UserMovieEntryResponseMapperFixtures.entity();

    const response = UserMovieEntryResponseMapper.toPatchEntryResponse(entity);

    expect(response).toEqual({
      entry: UserMovieEntryResponseMapper.toResponse(entity),
    });
  });

  it("converte posterPath relativo do catálogo em URL TMDB na listagem", () => {
    const listItem: UserMovieEntryListItemEntity = {
      ...UserMovieEntryResponseMapperFixtures.entity(),
      movie: {
        title: "Interestelar",
        year: 2014,
        posterPath: "/poster.jpg",
      },
    };

    const response = UserMovieEntryResponseMapper.toResponse(listItem);

    expect(response.movie).toEqual({
      title: "Interestelar",
      year: 2014,
      posterPath: TmdbPosterUtils.buildPosterUrl("/poster.jpg"),
    });
  });

  it("retorna movie.posterPath null quando catálogo não tem poster", () => {
    const listItem: UserMovieEntryListItemEntity = {
      ...UserMovieEntryResponseMapperFixtures.entity(),
      movie: {
        title: "Interestelar",
        year: 2014,
        posterPath: null,
      },
    };

    const response = UserMovieEntryResponseMapper.toResponse(listItem);

    expect(response.movie?.posterPath).toBeNull();
  });
});
