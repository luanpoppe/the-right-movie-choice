import z from "zod";
import { SingleQueryExampleSchema } from "@/domains/movies/domain/entities/movie-query-examples.entity";

export const MoviesQueryExamplesResponseDTOSchema = z.object({
  queries: z.array(SingleQueryExampleSchema),
});

export type MoviesQueryExamplesResponseDTO = z.infer<
  typeof MoviesQueryExamplesResponseDTOSchema
>;
