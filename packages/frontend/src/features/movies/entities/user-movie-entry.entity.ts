import z from "zod";

export const USER_MOVIE_ENTRY_MIN_RATING = 1;
export const USER_MOVIE_ENTRY_MAX_RATING = 10;

export const UserMovieEntryRatingSchema = z.union([
  z.null(),
  z
    .int()
    .min(USER_MOVIE_ENTRY_MIN_RATING)
    .max(USER_MOVIE_ENTRY_MAX_RATING),
]);

export const UserMovieEntryRatingValueSchema =
  UserMovieEntryRatingSchema.optional();

export const UserMovieEntrySchema = z.object({
  tmdbId: z.int().positive(),
  movieId: z.int().positive().nullable(),
  watched: z.boolean(),
  favorite: z.boolean(),
  inWatchlist: z.boolean(),
  rating: UserMovieEntryRatingSchema,
  watchedAt: z.union([z.null(), z.string()]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserMovieEntryEntity = z.infer<typeof UserMovieEntrySchema>;
