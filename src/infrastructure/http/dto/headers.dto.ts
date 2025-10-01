import z from "zod";

export const HeadersDTOSchema = z.object({
  chatid: z.string(),
});

export type HeadersDTO = z.infer<typeof HeadersDTOSchema>;
