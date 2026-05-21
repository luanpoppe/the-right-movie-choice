import { MultipleMoviesRecommendationsSchema } from "@/features/movies/entities/movie-recommendation.entity";
import z from "zod";

export const SingleMessageSchema = z.object({
  from: z.enum(["user", "ai"]),
  message: z.string(),
  movies: MultipleMoviesRecommendationsSchema.optional(),
});

export const ChatSchema = z.array(SingleMessageSchema);

export type ChatEntity = z.infer<typeof ChatSchema>;
