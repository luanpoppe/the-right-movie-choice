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

export class MovieQueryExamplesSchemaFactory {
  static createExact(count: number) {
    return z.object({
      queryExamples: z.array(SingleQueryExampleSchema).length(count),
    });
  }

  static createUpTo(count: number) {
    return z.object({
      queryExamples: z
        .array(SingleQueryExampleSchema)
        .min(1)
        .max(count),
    });
  }
}

export const MovieQueryExamplesSchema =
  MovieQueryExamplesSchemaFactory.createExact(MOVIE_QUERY_EXAMPLES_COUNT);

export type MovieQueryExamplesEntity = z.infer<typeof MovieQueryExamplesSchema>;
