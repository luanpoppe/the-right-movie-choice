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
  { id: 28, label: "Ação" },
  { id: 12, label: "Aventura" },
  { id: 16, label: "Animação" },
  { id: 35, label: "Comédia" },
  { id: 80, label: "Crime" },
  { id: 99, label: "Documentário" },
  { id: 18, label: "Drama" },
  { id: 10751, label: "Família" },
  { id: 14, label: "Fantasia" },
  { id: 36, label: "História" },
  { id: 27, label: "Terror" },
  { id: 10402, label: "Música" },
  { id: 9648, label: "Mistério" },
  { id: 10749, label: "Romance" },
  { id: 878, label: "Ficção científica" },
  { id: 53, label: "Suspense" },
  { id: 10752, label: "Guerra" },
  { id: 37, label: "Faroeste" },
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
    <div className="flex flex-col gap-5 rounded-2xl border border-border/50 bg-card/80 p-4 shadow-lg">
      <div className="flex flex-col gap-2">
        <Label>Gêneros</Label>
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
          label="Nota mínima"
          value={draft.minRating}
          onChange={(value) => updateDraft({ minRating: value })}
          placeholder="0–10"
          min={0}
          max={10}
        />
        <div className="grid grid-cols-2 gap-3">
          <CatalogSearchNumberField
            id="filter-year-from"
            label="Ano de"
            value={draft.yearFrom}
            onChange={(value) => updateDraft({ yearFrom: value })}
            placeholder="2010"
          />
          <CatalogSearchNumberField
            id="filter-year-to"
            label="Ano até"
            value={draft.yearTo}
            onChange={(value) => updateDraft({ yearTo: value })}
            placeholder="2015"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CatalogSearchNumberField
            id="filter-runtime-from"
            label="Duração de"
            value={draft.runtimeFrom}
            onChange={(value) => updateDraft({ runtimeFrom: value })}
            placeholder="60"
          />
          <CatalogSearchNumberField
            id="filter-runtime-to"
            label="Duração até"
            value={draft.runtimeTo}
            onChange={(value) => updateDraft({ runtimeTo: value })}
            placeholder="180"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-certification-country">País</Label>
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
            <Label htmlFor="filter-certification">Certificação</Label>
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
          label="Ator"
          value={draft.cast ?? []}
          onChange={(ids) => updateDraft({ cast: ids })}
          placeholder="Buscar por ator"
          language={language}
        />
        <CandidateSearchCombobox
          kind="person"
          label="Diretor"
          value={draft.director ?? []}
          onChange={(ids) => updateDraft({ director: ids })}
          placeholder="Buscar por diretor"
          language={language}
        />
        <CandidateSearchCombobox
          kind="keyword"
          label="Palavra-chave"
          value={draft.keyword ?? []}
          onChange={(ids) => updateDraft({ keyword: ids })}
          placeholder="Buscar por palavra-chave"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={handleClear}>
          Limpar
        </Button>
        <Button type="button" onClick={handleApply}>
          Aplicar filtros
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
