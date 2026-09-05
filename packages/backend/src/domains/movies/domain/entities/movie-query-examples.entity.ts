import z from "zod";

export const MOVIE_QUERY_EXAMPLES_COUNT = 3;

export const SingleQueryExampleSchema = z.object({
  queryExample: z
    .string()
    .nonempty()
    .describe(
      "Um exemplo curto e criativo de busca por filme, série, anime ou outra obra audiovisual",
    ),
});

export const MovieQueryExamplesSchema = z.object({
  queryExamples: z
    .array(SingleQueryExampleSchema)
    .length(MOVIE_QUERY_EXAMPLES_COUNT),
});

export type MovieQueryExamplesEntity = z.infer<typeof MovieQueryExamplesSchema>;
