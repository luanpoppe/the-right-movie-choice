import z from "zod";
import {
  MOVIE_QUERY_EXAMPLES_COUNT,
  SingleQueryExampleSchema,
} from "@/domains/movies/domain/entities/movie-query-examples.entity";

export const MoviesQueryExamplesResponseDTOSchema = z.object({
  queries: z.array(SingleQueryExampleSchema).length(MOVIE_QUERY_EXAMPLES_COUNT),
});

export type MoviesQueryExamplesResponseDTO = z.infer<
  typeof MoviesQueryExamplesResponseDTOSchema
>;
