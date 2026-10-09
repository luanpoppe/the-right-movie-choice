import type {
  MovieSearchHit,
  MovieSearchPage,
} from "@/domains/movies/domain/entities/movie-search.entity";
import { TmdbPosterUtils } from "@/modules/tmdb/domain/tmdb-poster.utils";
import type { MovieSearchPageResponseDTO } from "../dto/movie-catalog-search.dto";

type MovieSearchHitResponseDTO = MovieSearchPageResponseDTO["results"][number];

export class MovieCatalogSearchResponseMapper {
  static toSearchPage(page: MovieSearchPage): MovieSearchPageResponseDTO {
    const results = page.results.map((hit) =>
      MovieCatalogSearchResponseMapper.toSearchHit(hit),
    );

    const responsePage: MovieSearchPageResponseDTO = {
      page: page.page,
      results,
    };
    return responsePage;
  }

  private static toSearchHit(hit: MovieSearchHit): MovieSearchHitResponseDTO {
    const posterPath = TmdbPosterUtils.buildPosterUrl(hit.posterPath);

    const responseHit: MovieSearchHitResponseDTO = {
      ...hit,
      posterPath,
    };
    return responseHit;
  }
}
