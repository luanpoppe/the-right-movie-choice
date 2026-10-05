import z from "zod";

const TmdbKeywordSearchResultSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const TmdbKeywordSearchResponseSchema = z.object({
  page: z.number(),
  results: z.array(TmdbKeywordSearchResultSchema),
});

export type TmdbKeywordSearchResponse = z.infer<
  typeof TmdbKeywordSearchResponseSchema
>;
