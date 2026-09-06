import z from "zod";
import {
  UserMovieEntryRatingValueSchema,
  UserMovieEntrySchema,
} from "../entities/user-movie-entry.entity";

export const UserMovieEntryPatchDTOSchema = z
  .object({
    watched: z.boolean().optional(),
    favorite: z.boolean().optional(),
    inWatchlist: z.boolean().optional(),
    rating: UserMovieEntryRatingValueSchema,
    watchedAt: z.union([z.null(), z.iso.datetime()]).optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "At least one patch field is required",
  });

export type UserMovieEntryPatchDTO = z.infer<
  typeof UserMovieEntryPatchDTOSchema
>;

export type UserMovieEntryListFilter = {
  watched?: boolean;
  favorite?: boolean;
  inWatchlist?: boolean;
};

export const UserMovieEntryListResponseDTOSchema = z.object({
  entries: z.array(UserMovieEntrySchema),
});

export type UserMovieEntryListResponseDTO = z.infer<
  typeof UserMovieEntryListResponseDTOSchema
>;

export const UserMovieEntryPatchResponseDTOSchema = z.object({
  entry: UserMovieEntrySchema.nullable(),
});

export type UserMovieEntryPatchResponseDTO = z.infer<
  typeof UserMovieEntryPatchResponseDTOSchema
>;
