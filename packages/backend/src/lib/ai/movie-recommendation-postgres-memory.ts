import { AIMemory } from "@luanpoppe/ai";
import { env } from "@/env";

export class MovieRecommendationPostgresMemory {
  private static sharedInstance: AIMemory | undefined;

  static getShared(): AIMemory {
    if (MovieRecommendationPostgresMemory.sharedInstance) {
      return MovieRecommendationPostgresMemory.sharedInstance;
    }

    const connectionString = env.DATABASE_URL;
    const memory = new AIMemory({
      type: "postgres",
      connectionString,
    });
    MovieRecommendationPostgresMemory.sharedInstance = memory;
    return memory;
  }

  /** Limpa o singleton entre testes unitários. */
  static resetForTests(): void {
    MovieRecommendationPostgresMemory.sharedInstance = undefined;
  }
}
