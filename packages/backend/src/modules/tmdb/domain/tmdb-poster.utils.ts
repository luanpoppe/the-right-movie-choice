import { StringUtils } from "@/shared/utils/string.utils";
import { TmdbImageConstants } from "./tmdb-image.constants";

export class TmdbPosterUtils {
  static buildPosterUrl(
    posterPath: string | null,
    size: string = TmdbImageConstants.DEFAULT_POSTER_SIZE,
  ): string | null {
    if (StringUtils.isEmptyString(posterPath)) {
      return null;
    }

    const imageBaseUrl = TmdbImageConstants.IMAGE_BASE_URL;
    const posterSize = size;
    const posterUrl = `${imageBaseUrl}/${posterSize}${posterPath}`;
    return posterUrl;
  }
}
