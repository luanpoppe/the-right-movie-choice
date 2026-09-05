import { AITools } from "@luanpoppe/ai";
import type { AICallParams } from "@luanpoppe/ai";
import z from "zod";
import type {
  MovieCatalogLookupInput,
  MovieCatalogLookupResult,
} from "@/domains/movies/domain/entities/movie-catalog-lookup-result.entity";
import { Logger } from "@/lib/logger/logger";
import { MovieCatalogLookupService } from "./movie-catalog-lookup.service";

type LookupMoviesToolInput = {
  queries: Array<{ query: string; year?: number | undefined }>;
};

type AgentTool = NonNullable<
  NonNullable<AICallParams["agent"]>["tools"]
>[number];

export class MovieCatalogLookupAiTool {
  private static readonly MIN_QUERIES = 1;
  private static readonly MAX_QUERIES = 8;
  private static readonly TOOL_NAME = "lookupMovies";
  private static readonly TOOL_DESCRIPTION =
    "Uma chamada com várias queries de busca no catálogo de filmes; os lookups rodam em paralelo e os resultados mantêm a mesma ordem das queries (hits e misses).";

  private readonly aiTools = new AITools();

  constructor(private readonly catalogLookup: MovieCatalogLookupService) {}

  createLookupMoviesTool(): AgentTool {
    const schema = MovieCatalogLookupAiTool.buildInputSchema();
    const catalogLookup = this.catalogLookup;
    const toolFunction = async (
      input: LookupMoviesToolInput,
    ): Promise<MovieCatalogLookupResult[]> => {
      const startedAtMs = Date.now();
      const queryCount = input.queries.length;

      try {
        const lookupPromises = input.queries.map((queryItem) => {
          const lookupInput = MovieCatalogLookupAiTool.toLookupInput(queryItem);
          return catalogLookup.findDetailsByTitle(lookupInput);
        });
        const lookupResults = await Promise.all(lookupPromises);

        const durationMs = Date.now() - startedAtMs;
        MovieCatalogLookupAiTool.logSuccess(durationMs, queryCount);

        return lookupResults;
      } catch (error) {
        const durationMs = Date.now() - startedAtMs;
        MovieCatalogLookupAiTool.logFailure(durationMs, queryCount, error);
        throw error;
      }
    };

    const structuredTool = this.aiTools.createTool({
      name: MovieCatalogLookupAiTool.TOOL_NAME,
      description: MovieCatalogLookupAiTool.TOOL_DESCRIPTION,
      schema: schema as never,
      toolFunction: toolFunction as never,
    });

    return structuredTool as AgentTool;
  }

  private static toLookupInput(queryItem: {
    query: string;
    year?: number | undefined;
  }): MovieCatalogLookupInput {
    const year = queryItem.year;
    const hasYear = year !== undefined;
    if (!hasYear) {
      return { query: queryItem.query };
    }

    const lookupInput: MovieCatalogLookupInput = {
      query: queryItem.query,
      year,
    };
    return lookupInput;
  }

  private static buildInputSchema() {
    const queryItemSchema = z.object({
      query: z.string(),
      year: z.number().optional(),
    });
    const queriesSchema = z
      .array(queryItemSchema)
      .min(MovieCatalogLookupAiTool.MIN_QUERIES)
      .max(MovieCatalogLookupAiTool.MAX_QUERIES);

    return z.object({
      queries: queriesSchema,
    });
  }

  private static logSuccess(durationMs: number, queryCount: number) {
    Logger.info("Lookup batch no catálogo concluído", {
      durationMs,
      success: true,
      queryCount,
    });
  }

  private static logFailure(
    durationMs: number,
    queryCount: number,
    error: unknown,
  ) {
    const isErrorInstance = error instanceof Error;
    const errorMessage = isErrorInstance ? error.message : String(error);
    Logger.error("Lookup batch no catálogo falhou", {
      durationMs,
      success: false,
      queryCount,
      error: errorMessage,
    });
  }
}
