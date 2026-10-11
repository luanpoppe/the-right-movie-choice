import z from "zod";

const TmdbPersonKnownForItemSchema = z.looseObject({
  id: z.number(),
  title: z.string().optional(),
  name: z.string().optional(),
});

const TmdbPersonSearchResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  known_for_department: z.string().nullable().optional(),
  known_for: z.array(TmdbPersonKnownForItemSchema),
});

export const TmdbPersonSearchResponseSchema = z.object({
  page: z.number(),
  results: z.array(TmdbPersonSearchResultSchema),
});

export type TmdbPersonSearchResponse = z.infer<
  typeof TmdbPersonSearchResponseSchema
>;
