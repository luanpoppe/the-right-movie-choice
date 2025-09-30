import z from "zod";

export const HeadersDTOSchema = z.object({
  chatid: z.string(),
});

export type CookieDTO = z.infer<typeof HeadersDTOSchema>;
