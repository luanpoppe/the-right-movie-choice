import z from "zod";
import { SingleQueryExampleSchema } from "../entities/movies-query-examples.entity";

export const MoviesQueryExamplesResponseDTOSchema = z.object({
  queries: z.array(SingleQueryExampleSchema),
});

export type MoviesQueryExamplesResponseDTO = z.infer<
  typeof MoviesQueryExamplesResponseDTOSchema
>;
