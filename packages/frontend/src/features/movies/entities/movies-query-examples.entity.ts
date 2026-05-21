import z from "zod";

export const SingleQueryExampleSchema = z.object({
  queryExample: z.string().nonempty(),
});

export const MovieQueryExamplesSchema = z.object({
  queryExamples: z.array(SingleQueryExampleSchema),
});

export type MovieQueryExamplesEntity = z.infer<typeof MovieQueryExamplesSchema>;
