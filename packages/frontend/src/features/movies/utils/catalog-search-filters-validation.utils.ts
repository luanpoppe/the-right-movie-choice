import {
  CatalogSearchFiltersUtils,
  type CatalogSearchFilters,
} from "./catalog-search-filters.utils";

type CatalogSearchListField = "genres" | "cast" | "director" | "keyword";

export type CatalogSearchFiltersValidationError = {
  field: keyof CatalogSearchFilters;
  message: string;
};

export type CatalogSearchFiltersValidationResult = {
  valid: boolean;
  errors: CatalogSearchFiltersValidationError[];
  normalized: CatalogSearchFilters;
};

export class CatalogSearchFiltersValidationUtils {
  static readonly MIN_RATING = 0;
  static readonly MAX_RATING = 10;

  static validate(
    filters: CatalogSearchFilters,
  ): CatalogSearchFiltersValidationResult {
    const normalized: CatalogSearchFilters = { ...filters };
    const errors: CatalogSearchFiltersValidationError[] = [];

    this.applyRatingRule(filters, normalized, errors);
    this.applyPageRule(filters, normalized, errors);
    this.applyYearRangeRule(filters, normalized, errors);
    this.applyRuntimeRangeRule(filters, normalized, errors);
    this.applyCertificationRule(filters, normalized, errors);
    this.applyListRule(normalized, errors, "genres", filters.genres);
    this.applyListRule(normalized, errors, "cast", filters.cast);
    this.applyListRule(normalized, errors, "director", filters.director);
    this.applyListRule(normalized, errors, "keyword", filters.keyword);
    this.applyModeRule(filters, normalized, errors);

    const valid = errors.length === 0;
    return { valid, errors, normalized };
  }

  private static applyRatingRule(
    filters: CatalogSearchFilters,
    normalized: CatalogSearchFilters,
    errors: CatalogSearchFiltersValidationError[],
  ): void {
    const minRating = filters.minRating;
    if (minRating == null) return;

    const isBelowMinimum = minRating < this.MIN_RATING;
    const isAboveMaximum = minRating > this.MAX_RATING;
    if (!isBelowMinimum && !isAboveMaximum) return;

    const message = `A nota mínima deve ficar entre ${this.MIN_RATING} e ${this.MAX_RATING}.`;
    errors.push({ field: "minRating", message });
    normalized.minRating = undefined;
  }

  private static applyPageRule(
    filters: CatalogSearchFilters,
    normalized: CatalogSearchFilters,
    errors: CatalogSearchFiltersValidationError[],
  ): void {
    const page = filters.page;
    if (page == null) return;

    const isAtLeastOne = page >= 1;
    if (isAtLeastOne) return;

    errors.push({ field: "page", message: "A página deve ser no mínimo 1." });
    normalized.page = 1;
  }

  private static applyYearRangeRule(
    filters: CatalogSearchFilters,
    normalized: CatalogSearchFilters,
    errors: CatalogSearchFiltersValidationError[],
  ): void {
    const yearFrom = filters.yearFrom;
    const yearTo = filters.yearTo;
    if (yearFrom == null || yearTo == null) return;

    const isInverted = yearFrom > yearTo;
    if (!isInverted) return;

    const message = "O ano inicial não pode ser maior que o ano final.";
    errors.push({ field: "yearFrom", message });
    normalized.yearFrom = yearTo;
    normalized.yearTo = yearFrom;
  }

  private static applyRuntimeRangeRule(
    filters: CatalogSearchFilters,
    normalized: CatalogSearchFilters,
    errors: CatalogSearchFiltersValidationError[],
  ): void {
    const runtimeFrom = filters.runtimeFrom;
    const runtimeTo = filters.runtimeTo;
    if (runtimeFrom == null || runtimeTo == null) return;

    const isInverted = runtimeFrom > runtimeTo;
    if (!isInverted) return;

    const message = "A duração inicial não pode ser maior que a duração final.";
    errors.push({ field: "runtimeFrom", message });
    normalized.runtimeFrom = runtimeTo;
    normalized.runtimeTo = runtimeFrom;
  }

  private static applyCertificationRule(
    filters: CatalogSearchFilters,
    normalized: CatalogSearchFilters,
    errors: CatalogSearchFiltersValidationError[],
  ): void {
    const hasCountry = filters.certificationCountry != null;
    const hasCertification = filters.certification != null;
    const isPaired = hasCountry === hasCertification;
    if (isPaired) return;

    const message = "Informe o país e a certificação juntos, ou nenhum dos dois.";
    const field = hasCountry ? "certificationCountry" : "certification";
    errors.push({ field, message });
    normalized.certificationCountry = undefined;
    normalized.certification = undefined;
  }

  private static applyListRule(
    normalized: CatalogSearchFilters,
    errors: CatalogSearchFiltersValidationError[],
    field: CatalogSearchListField,
    ids: number[] | undefined,
  ): void {
    if (ids == null) return;

    const invalidIds = ids.filter((id) => !this.isPositiveInteger(id));
    if (invalidIds.length === 0) return;

    const message = `Os ids de "${field}" devem ser inteiros positivos.`;
    errors.push({ field, message });

    const validIds = ids.filter((id) => this.isPositiveInteger(id));
    if (validIds.length === 0) {
      normalized[field] = undefined;
      return;
    }

    normalized[field] = validIds;
  }

  private static applyModeRule(
    filters: CatalogSearchFilters,
    normalized: CatalogSearchFilters,
    errors: CatalogSearchFiltersValidationError[],
  ): void {
    const hasQuery = filters.query != null;
    const hasDiscoverFilters = CatalogSearchFiltersUtils.hasDiscoverFilters(
      filters,
    );
    if (!hasQuery || !hasDiscoverFilters) return;

    const message =
      "Busca por texto e filtros de discover não podem ser combinados.";
    errors.push({ field: "query", message });
    normalized.query = undefined;
  }

  private static isPositiveInteger(value: number): boolean {
    const isInteger = Number.isInteger(value);
    const isPositive = value > 0;
    return isInteger && isPositive;
  }
}
