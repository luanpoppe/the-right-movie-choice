import z from "zod";

export const SingleQueryExampleSchema = z.object({
  queryExample: z
    .string()
    .nonempty()
    .describe("Um exemplo curto e criativo de busca por filme"),
});

export const MovieQueryExamplesSchema = z.object({
  queryExamples: z.array(SingleQueryExampleSchema),
});

export type MovieQueryExamplesEntity = z.infer<typeof MovieQueryExamplesSchema>;
