export type CatalogSearchLanguage = "en-US" | "pt-BR";

export type CatalogSearchMode = "discover" | "search";

export type CatalogSearchFilters = {
  query?: string;
  page?: number;
  language?: CatalogSearchLanguage;
  genres?: number[];
  minRating?: number;
  yearFrom?: number;
  yearTo?: number;
  cast?: number[];
  director?: number[];
  keyword?: number[];
  runtimeFrom?: number;
  runtimeTo?: number;
  certificationCountry?: string;
  certification?: string;
};

export class CatalogSearchFiltersUtils {
  static parse(searchParams: URLSearchParams): CatalogSearchFilters {
    const filters: CatalogSearchFilters = {};

    const query = this.readString(searchParams, "query");
    if (query != null) filters.query = query;

    const page = this.readNumber(searchParams, "page");
    if (page != null) filters.page = page;

    const language = this.readLanguage(searchParams);
    if (language != null) filters.language = language;

    const genres = this.readNumberList(searchParams, "genres");
    if (genres != null) filters.genres = genres;

    const minRating = this.readNumber(searchParams, "minRating");
    if (minRating != null) filters.minRating = minRating;

    const yearFrom = this.readNumber(searchParams, "yearFrom");
    if (yearFrom != null) filters.yearFrom = yearFrom;

    const yearTo = this.readNumber(searchParams, "yearTo");
    if (yearTo != null) filters.yearTo = yearTo;

    const cast = this.readNumberList(searchParams, "cast");
    if (cast != null) filters.cast = cast;

    const director = this.readNumberList(searchParams, "director");
    if (director != null) filters.director = director;

    const keyword = this.readNumberList(searchParams, "keyword");
    if (keyword != null) filters.keyword = keyword;

    const runtimeFrom = this.readNumber(searchParams, "runtimeFrom");
    if (runtimeFrom != null) filters.runtimeFrom = runtimeFrom;

    const runtimeTo = this.readNumber(searchParams, "runtimeTo");
    if (runtimeTo != null) filters.runtimeTo = runtimeTo;

    const certificationCountry = this.readString(
      searchParams,
      "certificationCountry",
    );
    if (certificationCountry != null) {
      filters.certificationCountry = certificationCountry;
    }

    const certification = this.readString(searchParams, "certification");
    if (certification != null) filters.certification = certification;

    return filters;
  }

  static serialize(filters: CatalogSearchFilters): URLSearchParams {
    const searchParams = new URLSearchParams();

    this.setString(searchParams, "query", filters.query);
    this.setNumber(searchParams, "page", filters.page);
    this.setString(searchParams, "language", filters.language);
    this.setList(searchParams, "genres", filters.genres);
    this.setNumber(searchParams, "minRating", filters.minRating);
    this.setNumber(searchParams, "yearFrom", filters.yearFrom);
    this.setNumber(searchParams, "yearTo", filters.yearTo);
    this.setList(searchParams, "cast", filters.cast);
    this.setList(searchParams, "director", filters.director);
    this.setList(searchParams, "keyword", filters.keyword);
    this.setNumber(searchParams, "runtimeFrom", filters.runtimeFrom);
    this.setNumber(searchParams, "runtimeTo", filters.runtimeTo);
    this.setString(
      searchParams,
      "certificationCountry",
      filters.certificationCountry,
    );
    this.setString(searchParams, "certification", filters.certification);

    return searchParams;
  }

  static hasDiscoverFilters(filters: CatalogSearchFilters): boolean {
    const hasListFilter =
      (filters.genres?.length ?? 0) > 0 ||
      (filters.cast?.length ?? 0) > 0 ||
      (filters.director?.length ?? 0) > 0 ||
      (filters.keyword?.length ?? 0) > 0;

    const hasScalarFilter =
      filters.minRating != null ||
      filters.yearFrom != null ||
      filters.yearTo != null ||
      filters.runtimeFrom != null ||
      filters.runtimeTo != null ||
      filters.certificationCountry != null ||
      filters.certification != null;

    return hasListFilter || hasScalarFilter;
  }

  static resolveMode(filters: CatalogSearchFilters): CatalogSearchMode {
    const hasDiscoverFilters = this.hasDiscoverFilters(filters);
    if (hasDiscoverFilters) return "discover";

    return "search";
  }

  private static readString(
    searchParams: URLSearchParams,
    key: string,
  ): string | undefined {
    const rawValue = searchParams.get(key);
    if (rawValue == null) {
      return undefined;
    }

    const trimmedValue = rawValue.trim();
    if (trimmedValue.length === 0) {
      return undefined;
    }

    return trimmedValue;
  }

  private static readNumber(
    searchParams: URLSearchParams,
    key: string,
  ): number | undefined {
    const rawValue = this.readString(searchParams, key);
    if (rawValue == null) {
      return undefined;
    }

    const parsedValue = Number(rawValue);
    const isValidNumber = Number.isFinite(parsedValue);
    if (!isValidNumber) {
      return undefined;
    }

    return parsedValue;
  }

  private static readNumberList(
    searchParams: URLSearchParams,
    key: string,
  ): number[] | undefined {
    const rawValue = searchParams.get(key);
    if (rawValue == null) {
      return undefined;
    }

    const tokens = rawValue.split(",");
    const values: number[] = [];
    for (const token of tokens) {
      const trimmedToken = token.trim();
      if (trimmedToken.length === 0) continue;

      const parsedValue = Number(trimmedToken);
      const isValidNumber = Number.isFinite(parsedValue);
      if (!isValidNumber) continue;

      values.push(parsedValue);
    }

    if (values.length === 0) {
      return undefined;
    }

    return values;
  }

  private static readLanguage(
    searchParams: URLSearchParams,
  ): CatalogSearchLanguage | undefined {
    const rawValue = this.readString(searchParams, "language");
    const isSupportedLanguage = rawValue === "en-US" || rawValue === "pt-BR";
    if (!isSupportedLanguage) {
      return undefined;
    }

    return rawValue;
  }

  private static setString(
    searchParams: URLSearchParams,
    key: string,
    value: string | undefined,
  ): void {
    if (value == null) return;
    searchParams.set(key, value);
  }

  private static setNumber(
    searchParams: URLSearchParams,
    key: string,
    value: number | undefined,
  ): void {
    if (value == null) return;

    const encodedValue = String(value);
    searchParams.set(key, encodedValue);
  }

  private static setList(
    searchParams: URLSearchParams,
    key: string,
    value: number[] | undefined,
  ): void {
    if (value == null || value.length === 0) return;

    const encodedValue = value.join(",");
    searchParams.set(key, encodedValue);
  }
}
