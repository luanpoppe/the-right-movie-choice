import { AITools } from "@luanpoppe/ai";
import type { AICallParams } from "@luanpoppe/ai";
import z from "zod";
import type { DiscoverCatalogMoviesUseCase } from "@/domains/movies/application/use-cases/discover-catalog-movies.use-case";
import type {
  SearchCatalogMoviesInput,
  SearchCatalogMoviesUseCase,
} from "@/domains/movies/application/use-cases/search-catalog-movies.use-case";
import type { MovieDiscoverQuery } from "@/domains/movies/domain/entities/movie-discover-query.entity";
import type {
  MovieCatalogSearchToolHit,
  MovieCatalogSearchToolInput,
  MovieCatalogSearchToolResult,
} from "@/domains/movies/domain/entities/movie-catalog-search-tool.entity";
import { MovieCatalogSearchToolInputSchema } from "@/domains/movies/domain/entities/movie-catalog-search-tool.entity";
import type { MovieSearchHit } from "@/domains/movies/domain/entities/movie-search.entity";
import { MovieCatalogSearchValidationException } from "@/domains/movies/domain/movie-catalog-search.constants";
import { Logger } from "@/lib/logger/logger";
import { TmdbHttpException } from "@/modules/tmdb/domain/exceptions/tmdb-http.exception";
import { TmdbPosterUtils } from "@/modules/tmdb/domain/tmdb-poster.utils";
import { StringUtils } from "@/shared/utils/string.utils";

type AgentTool = NonNullable<
  NonNullable<AICallParams["agent"]>["tools"]
>[number];

export class SearchCatalogAiTool {
  private static readonly TOOL_NAME = "searchCatalog";
  private static readonly TOOL_DESCRIPTION =
    "Busca filmes no catálogo TMDB ao vivo. Use por texto quando souber o nome (query), ou sem texto para os populares. Para filtrar por gênero/nota/anos/duração/certificação, envie os filtros de discover SEM query. Ids de gênero comuns do TMDB: 28 ação, 35 comédia, 18 drama, 27 terror, 878 ficção científica. language opcional: en-US (default) ou pt-BR.";
  private static readonly EMPTY_RESULTS_NOTICE = "Nenhum filme encontrado";
  private static readonly MIXED_MODES_NOTICE =
    "query de texto e filtros de discover não podem ser usados na mesma chamada";
  private static readonly TMDB_UNAVAILABLE_NOTICE =
    "Catálogo indisponível no momento. Tente novamente.";

  private readonly aiTools = new AITools();

  constructor(
    private readonly searchCatalogMoviesUseCase: SearchCatalogMoviesUseCase,
    private readonly discoverCatalogMoviesUseCase: DiscoverCatalogMoviesUseCase,
  ) {}

  createSearchCatalogTool(): AgentTool {
    const searchCatalogMoviesUseCase = this.searchCatalogMoviesUseCase;
    const discoverCatalogMoviesUseCase = this.discoverCatalogMoviesUseCase;
    const toolFunction = async (
      rawInput: unknown,
    ): Promise<MovieCatalogSearchToolResult> => {
      const startedAtMs = Date.now();
      const parsed = MovieCatalogSearchToolInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        const notice = SearchCatalogAiTool.formatValidationError(parsed.error);
        return SearchCatalogAiTool.buildMiss(notice, startedAtMs, "validation");
      }

      const input = parsed.data;
      const isTextQuery = SearchCatalogAiTool.hasTextQuery(input);
      const hasDiscoverFilters =
        SearchCatalogAiTool.hasDiscoverFilters(input);

      if (isTextQuery && hasDiscoverFilters) {
        return SearchCatalogAiTool.buildMiss(
          SearchCatalogAiTool.MIXED_MODES_NOTICE,
          startedAtMs,
          "mixed-modes",
        );
      }

      try {
        if (isTextQuery) {
          const searchInput = SearchCatalogAiTool.buildSearchInput(input);
          const searchPage =
            await searchCatalogMoviesUseCase.execute(searchInput);
          return SearchCatalogAiTool.buildFound(
            searchPage.results,
            startedAtMs,
            "text",
          );
        }

        if (hasDiscoverFilters) {
          const discoverQuery =
            SearchCatalogAiTool.buildDiscoverQuery(input);
          const searchPage =
            await discoverCatalogMoviesUseCase.execute(discoverQuery);
          return SearchCatalogAiTool.buildFound(
            searchPage.results,
            startedAtMs,
            "discover",
          );
        }

        const popularInput = SearchCatalogAiTool.buildPopularInput(input);
        const searchPage =
          await searchCatalogMoviesUseCase.execute(popularInput);
        return SearchCatalogAiTool.buildFound(
          searchPage.results,
          startedAtMs,
          "popular",
        );
      } catch (error) {
        const notice = SearchCatalogAiTool.resolveErrorNotice(error);
        return SearchCatalogAiTool.buildMiss(notice, startedAtMs, "failure");
      }
    };

    const structuredTool = this.aiTools.createTool({
      name: SearchCatalogAiTool.TOOL_NAME,
      description: SearchCatalogAiTool.TOOL_DESCRIPTION,
      schema: MovieCatalogSearchToolInputSchema as never,
      toolFunction: toolFunction as never,
    });

    return structuredTool as AgentTool;
  }

  private static hasTextQuery(input: MovieCatalogSearchToolInput): boolean {
    return !StringUtils.isEmptyString(input.query);
  }

  private static hasDiscoverFilters(input: MovieCatalogSearchToolInput): boolean {
    const hasGenres = input.genres !== undefined && input.genres.length > 0;
    const hasMinRating = input.minRating !== undefined;
    const hasYearRange =
      input.yearFrom !== undefined || input.yearTo !== undefined;
    const hasRuntimeRange =
      input.runtimeFrom !== undefined || input.runtimeTo !== undefined;
    const hasCertification =
      !StringUtils.isEmptyString(input.certificationCountry) ||
      !StringUtils.isEmptyString(input.certification);

    return (
      hasGenres ||
      hasMinRating ||
      hasYearRange ||
      hasRuntimeRange ||
      hasCertification
    );
  }

  private static buildSearchInput(
    input: MovieCatalogSearchToolInput,
  ): SearchCatalogMoviesInput {
    const searchInput: SearchCatalogMoviesInput = {};

    if (input.query !== undefined) {
      searchInput.query = input.query;
    }
    if (input.year !== undefined) {
      searchInput.year = input.year;
    }
    if (input.page !== undefined) {
      searchInput.page = input.page;
    }
    if (input.language !== undefined) {
      searchInput.language = input.language;
    }

    return searchInput;
  }

  private static buildPopularInput(
    input: MovieCatalogSearchToolInput,
  ): SearchCatalogMoviesInput {
    const searchInput: SearchCatalogMoviesInput = {};

    if (input.page !== undefined) {
      searchInput.page = input.page;
    }
    if (input.language !== undefined) {
      searchInput.language = input.language;
    }

    return searchInput;
  }

  private static buildDiscoverQuery(
    input: MovieCatalogSearchToolInput,
  ): MovieDiscoverQuery {
    const discoverQuery: MovieDiscoverQuery = {};

    if (input.genres !== undefined) {
      discoverQuery.genres = input.genres;
    }
    if (input.minRating !== undefined) {
      discoverQuery.minRating = input.minRating;
    }
    if (input.yearFrom !== undefined) {
      discoverQuery.yearFrom = input.yearFrom;
    }
    if (input.yearTo !== undefined) {
      discoverQuery.yearTo = input.yearTo;
    }
    if (input.runtimeFrom !== undefined) {
      discoverQuery.runtimeFrom = input.runtimeFrom;
    }
    if (input.runtimeTo !== undefined) {
      discoverQuery.runtimeTo = input.runtimeTo;
    }
    if (input.certificationCountry !== undefined) {
      discoverQuery.certificationCountry = input.certificationCountry;
    }
    if (input.certification !== undefined) {
      discoverQuery.certification = input.certification;
    }
    if (input.page !== undefined) {
      discoverQuery.page = input.page;
    }
    if (input.language !== undefined) {
      discoverQuery.language = input.language;
    }

    return discoverQuery;
  }

  private static mapHits(hits: MovieSearchHit[]): MovieCatalogSearchToolHit[] {
    return hits.map((hit) => {
      const posterUrl = TmdbPosterUtils.buildPosterUrl(hit.posterPath);
      const mappedHit: MovieCatalogSearchToolHit = {
        id: hit.id,
        title: hit.title,
        year: hit.year,
        overview: hit.overview,
        posterUrl,
      };
      return mappedHit;
    });
  }

  private static buildFound(
    hits: MovieSearchHit[],
    startedAtMs: number,
    mode: string,
  ): MovieCatalogSearchToolResult {
    const results = SearchCatalogAiTool.mapHits(hits);
    const durationMs = Date.now() - startedAtMs;
    const hasResults = results.length > 0;

    if (!hasResults) {
      Logger.info("Search catalog tool sem resultados", {
        durationMs,
        success: true,
        mode,
        resultCount: 0,
      });
      return {
        found: true,
        results: [],
        notice: SearchCatalogAiTool.EMPTY_RESULTS_NOTICE,
      };
    }

    Logger.info("Search catalog tool concluída", {
      durationMs,
      success: true,
      mode,
      resultCount: results.length,
    });
    return { found: true, results };
  }

  private static buildMiss(
    notice: string,
    startedAtMs: number,
    reason: string,
  ): MovieCatalogSearchToolResult {
    const durationMs = Date.now() - startedAtMs;

    Logger.warn("Search catalog tool retornou miss", {
      durationMs,
      success: false,
      reason,
      notice,
    });

    return { found: false, results: [], notice };
  }

  private static resolveErrorNotice(error: unknown): string {
    if (error instanceof MovieCatalogSearchValidationException) {
      return error.message;
    }

    if (error instanceof TmdbHttpException) {
      return SearchCatalogAiTool.TMDB_UNAVAILABLE_NOTICE;
    }

    const isErrorInstance = error instanceof Error;
    const errorMessage = isErrorInstance ? error.message : String(error);
    return `Falha ao consultar o catálogo: ${errorMessage}`;
  }

  private static formatValidationError(error: z.ZodError): string {
    const issues = error.issues.map((issue) => issue.message);
    return issues.join("; ");
  }
}
