import z from "zod";
import { UserMovieEntryValidationUtils } from "@/domains/movies/domain/user-movie-entry-validation.utils";

const ratingSchema = z.union([
  z.null(),
  z
    .int()
    .min(UserMovieEntryValidationUtils.MIN_RATING)
    .max(UserMovieEntryValidationUtils.MAX_RATING),
]);

const ratingValueSchema = ratingSchema.optional();

const optionalQueryBooleanSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

export const UserMovieEntryPatchDTOSchema = z
  .object({
    watched: z.boolean().optional(),
    favorite: z.boolean().optional(),
    inWatchlist: z.boolean().optional(),
    rating: ratingValueSchema,
    watchedAt: z.union([z.null(), z.iso.datetime()]).optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "At least one patch field is required",
  });

export type UserMovieEntryPatchDTO = z.infer<
  typeof UserMovieEntryPatchDTOSchema
>;

export const UserMovieEntryListQueryDTOSchema = z.object({
  watched: optionalQueryBooleanSchema,
  favorite: optionalQueryBooleanSchema,
  inWatchlist: optionalQueryBooleanSchema,
});

export type UserMovieEntryListQueryDTO = z.infer<
  typeof UserMovieEntryListQueryDTOSchema
>;

export const UserMovieEntryTmdbIdParamsSchema = z.object({
  tmdbId: z.coerce.number().int().positive(),
});

export type UserMovieEntryTmdbIdParams = z.infer<
  typeof UserMovieEntryTmdbIdParamsSchema
>;

export const UserMovieEntryResponseSchema = z.object({
  tmdbId: z.int().positive(),
  movieId: z.int().positive().nullable(),
  watched: z.boolean(),
  favorite: z.boolean(),
  inWatchlist: z.boolean(),
  rating: ratingSchema,
  watchedAt: z.union([z.null(), z.string()]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserMovieEntryResponse = z.infer<
  typeof UserMovieEntryResponseSchema
>;

export const UserMovieEntryGetResponseDTOSchema = z.object({
  entry: UserMovieEntryResponseSchema,
});

export type UserMovieEntryGetResponseDTO = z.infer<
  typeof UserMovieEntryGetResponseDTOSchema
>;

export const UserMovieEntryListResponseDTOSchema = z.object({
  entries: z.array(UserMovieEntryResponseSchema),
});

export type UserMovieEntryListResponseDTO = z.infer<
  typeof UserMovieEntryListResponseDTOSchema
>;

export const UserMovieEntryPatchResponseDTOSchema = z.object({
  entry: UserMovieEntryResponseSchema.nullable(),
});

export type UserMovieEntryPatchResponseDTO = z.infer<
  typeof UserMovieEntryPatchResponseDTOSchema
>;
