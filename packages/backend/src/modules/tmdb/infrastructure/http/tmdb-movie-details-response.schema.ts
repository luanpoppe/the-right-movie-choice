import z from "zod";

const TmdbGenreSchema = z.object({
  name: z.string(),
});

const TmdbCastMemberSchema = z.object({
  name: z.string(),
});

const TmdbCrewMemberSchema = z.object({
  name: z.string(),
  job: z.string(),
});

const TmdbCreditsSchema = z.object({
  cast: z.array(TmdbCastMemberSchema).optional(),
  crew: z.array(TmdbCrewMemberSchema).optional(),
});

const TmdbWatchProviderOfferSchema = z.object({
  provider_name: z.string(),
  logo_path: z.string().nullable(),
});

const TmdbWatchProvidersCountrySchema = z.object({
  flatrate: z.array(TmdbWatchProviderOfferSchema).optional(),
  rent: z.array(TmdbWatchProviderOfferSchema).optional(),
  buy: z.array(TmdbWatchProviderOfferSchema).optional(),
});

const TmdbWatchProvidersSchema = z.object({
  results: z
    .object({
      BR: TmdbWatchProvidersCountrySchema.optional(),
    })
    .optional(),
});

const TmdbExternalIdsSchema = z.object({
  imdb_id: z.string().nullable().optional(),
});

export const TmdbMovieDetailsResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string(),
  poster_path: z.string().nullable().optional(),
  release_date: z.string(),
  runtime: z.number().nullable().optional(),
  vote_average: z.number().optional(),
  genres: z.array(TmdbGenreSchema).optional(),
  origin_country: z.array(z.string()).optional(),
  credits: TmdbCreditsSchema.optional(),
  "watch/providers": TmdbWatchProvidersSchema.optional(),
  external_ids: TmdbExternalIdsSchema.optional(),
});

export type TmdbMovieDetailsResponse = z.infer<typeof TmdbMovieDetailsResponseSchema>;
