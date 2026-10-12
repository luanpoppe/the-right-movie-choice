import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CatalogSearchFilters,
  CatalogSearchLanguage,
} from "../utils/catalog-search-filters.utils";
import { CandidateSearchCombobox } from "./candidate-search-combobox";
import { CatalogSearchNumberField } from "./catalog-search-number-field";

type DiscoverFiltersDraft = Omit<
  CatalogSearchFilters,
  "query" | "page" | "language"
>;

interface CatalogSearchFiltersPanelProps {
  filters: CatalogSearchFilters;
  onApply: (filters: CatalogSearchFilters) => void;
  language: CatalogSearchLanguage;
}

interface GenreOption {
  id: number;
  label: string;
}

const COMMON_GENRES: ReadonlyArray<GenreOption> = [
  { id: 28, label: "Action" },
  { id: 12, label: "Adventure" },
  { id: 16, label: "Animation" },
  { id: 35, label: "Comedy" },
  { id: 80, label: "Crime" },
  { id: 99, label: "Documentary" },
  { id: 18, label: "Drama" },
  { id: 10751, label: "Family" },
  { id: 14, label: "Fantasy" },
  { id: 36, label: "History" },
  { id: 27, label: "Horror" },
  { id: 10402, label: "Music" },
  { id: 9648, label: "Mystery" },
  { id: 10749, label: "Romance" },
  { id: 878, label: "Science Fiction" },
  { id: 53, label: "Thriller" },
  { id: 10752, label: "War" },
  { id: 37, label: "Western" },
];

export function CatalogSearchFiltersPanel({
  filters,
  onApply,
  language,
}: CatalogSearchFiltersPanelProps) {
  const [draft, setDraft] = useState<DiscoverFiltersDraft>(() =>
    toDiscoverDraft(filters),
  );

  const appliedDiscoverSignature = JSON.stringify(toDiscoverDraft(filters));
  const appliedSignatureRef = useRef(appliedDiscoverSignature);

  useEffect(() => {
    const hasAppliedDiscoverChanged =
      appliedSignatureRef.current !== appliedDiscoverSignature;
    if (!hasAppliedDiscoverChanged) {
      return;
    }

    appliedSignatureRef.current = appliedDiscoverSignature;
    setDraft(toDiscoverDraft(filters));
  }, [filters, appliedDiscoverSignature]);

  const updateDraft = (patch: Partial<DiscoverFiltersDraft>) => {
    setDraft((currentDraft) => ({ ...currentDraft, ...patch }));
  };

  const toggleGenre = (genreId: number) => {
    const currentGenres = draft.genres ?? [];
    const isSelected = currentGenres.includes(genreId);
    if (isSelected) {
      const nextGenres = currentGenres.filter((id) => id !== genreId);
      updateDraft({ genres: nextGenres });
      return;
    }

    updateDraft({ genres: [...currentGenres, genreId] });
  };

  const handleApply = () => {
    onApply({ ...filters, ...draft });
  };

  const handleClear = () => {
    const emptyDraft = toDiscoverDraft({});
    setDraft(emptyDraft);
    onApply({ ...filters, ...emptyDraft });
  };

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2">
        <Label>Genres</Label>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_GENRES.map((genre) => {
            const isSelected = (draft.genres ?? []).includes(genre.id);

            return (
              <Button
                key={genre.id}
                type="button"
                size="sm"
                variant={isSelected ? "default" : "outline"}
                aria-pressed={isSelected}
                onClick={() => toggleGenre(genre.id)}
                className="rounded-lg"
              >
                {genre.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CatalogSearchNumberField
          id="filter-min-rating"
          label="Minimum rating"
          value={draft.minRating}
          onChange={(value) => updateDraft({ minRating: value })}
          placeholder="0–10"
          min={0}
          max={10}
        />
        <div className="grid grid-cols-2 gap-3">
          <CatalogSearchNumberField
            id="filter-year-from"
            label="Year from"
            value={draft.yearFrom}
            onChange={(value) => updateDraft({ yearFrom: value })}
            placeholder="2010"
          />
          <CatalogSearchNumberField
            id="filter-year-to"
            label="Year to"
            value={draft.yearTo}
            onChange={(value) => updateDraft({ yearTo: value })}
            placeholder="2015"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CatalogSearchNumberField
            id="filter-runtime-from"
            label="Runtime from"
            value={draft.runtimeFrom}
            onChange={(value) => updateDraft({ runtimeFrom: value })}
            placeholder="60"
          />
          <CatalogSearchNumberField
            id="filter-runtime-to"
            label="Runtime to"
            value={draft.runtimeTo}
            onChange={(value) => updateDraft({ runtimeTo: value })}
            placeholder="180"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-certification-country">Country</Label>
            <Input
              id="filter-certification-country"
              value={draft.certificationCountry ?? ""}
              onChange={(event) =>
                updateDraft({ certificationCountry: event.target.value })
              }
              placeholder="BR"
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-certification">Certification</Label>
            <Input
              id="filter-certification"
              value={draft.certification ?? ""}
              onChange={(event) =>
                updateDraft({ certification: event.target.value })
              }
              placeholder="14"
              className="h-9"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CandidateSearchCombobox
          kind="person"
          label="Actor"
          value={draft.cast ?? []}
          onChange={(ids) => updateDraft({ cast: ids })}
          placeholder="Search by actor"
          language={language}
        />
        <CandidateSearchCombobox
          kind="person"
          label="Director"
          value={draft.director ?? []}
          onChange={(ids) => updateDraft({ director: ids })}
          placeholder="Search by director"
          language={language}
        />
        <CandidateSearchCombobox
          kind="keyword"
          label="Keyword"
          value={draft.keyword ?? []}
          onChange={(ids) => updateDraft({ keyword: ids })}
          placeholder="Search by keyword"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={handleClear}>
          Clear
        </Button>
        <Button type="button" onClick={handleApply}>
          Apply filters
        </Button>
      </div>
    </div>
  );
}

function toDiscoverDraft(filters: CatalogSearchFilters): DiscoverFiltersDraft {
  return {
    genres: filters.genres,
    minRating: filters.minRating,
    yearFrom: filters.yearFrom,
    yearTo: filters.yearTo,
    cast: filters.cast,
    director: filters.director,
    keyword: filters.keyword,
    runtimeFrom: filters.runtimeFrom,
    runtimeTo: filters.runtimeTo,
    certificationCountry: filters.certificationCountry,
    certification: filters.certification,
  };
}
