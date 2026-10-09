import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MovieCatalogSearchService } from "../services/movie-catalog-search.service";
import {
  CandidateLabelCacheUtils,
  type CandidateLabelKind,
} from "../utils/candidate-label-cache.utils";
import type { CatalogSearchLanguage } from "../utils/catalog-search-filters.utils";

type CandidateKind = CandidateLabelKind;

interface CandidateOption {
  id: number;
  label: string;
  subtitle?: string;
}

interface CandidateSearchComboboxProps {
  kind: CandidateKind;
  label: string;
  value: number[];
  onChange: (ids: number[]) => void;
  selectedLabels?: Record<number, string>;
  placeholder?: string;
  language?: CatalogSearchLanguage;
}

const DEBOUNCE_MS = 300;

export function CandidateSearchCombobox({
  kind,
  label,
  value,
  onChange,
  selectedLabels,
  placeholder,
  language,
}: CandidateSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<CandidateOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [learnedLabels, setLearnedLabels] = useState<Record<number, string>>(
    () => CandidateLabelCacheUtils.read(kind),
  );

  const requestIdRef = useRef(0);

  const trimmedQuery = query.trim();
  const isResultsVisible = trimmedQuery.length > 0;

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (trimmedQuery.length === 0) {
      setOptions([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const foundOptions = await loadCandidates(kind, trimmedQuery, language);
          if (requestId !== requestIdRef.current) {
            return;
          }

          setOptions(foundOptions);
          const foundLabels = optionsToLabels(foundOptions);
          const mergedLabels = CandidateLabelCacheUtils.merge(kind, foundLabels);
          setLearnedLabels(mergedLabels);
          setHasError(false);
        } catch {
          if (requestId !== requestIdRef.current) {
            return;
          }

          setOptions([]);
          setHasError(true);
        } finally {
          if (requestId === requestIdRef.current) {
            setIsLoading(false);
          }
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      requestIdRef.current += 1;
    };
  }, [trimmedQuery, kind, language]);

  const resolveLabel = (id: number): string => {
    const providedLabel = selectedLabels?.[id];
    if (providedLabel != null) {
      return providedLabel;
    }

    const learnedLabel = learnedLabels[id];
    if (learnedLabel != null) {
      return learnedLabel;
    }

    return `#${id}`;
  };

  const removeId = (id: number) => {
    const nextValue = value.filter((currentId) => currentId !== id);
    onChange(nextValue);
  };

  const toggleId = (id: number) => {
    const isSelected = value.includes(id);
    if (isSelected) {
      removeId(id);
      return;
    }

    onChange([...value, id]);
  };

  const handleSelect = (option: CandidateOption) => {
    toggleId(option.id);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`candidate-search-${kind}`}>{label}</Label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1 py-1">
              {resolveLabel(id)}
              <button
                type="button"
                onClick={() => removeId(id)}
                aria-label={`Remover ${resolveLabel(id)}`}
                className="rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Input
        id={`candidate-search-${kind}`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-9"
      />

      {isResultsVisible && (
        <div className="max-h-48 overflow-y-auto rounded-md border border-border/60 bg-popover shadow-sm">
          {isLoading && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Buscando...
            </p>
          )}

          {!isLoading && hasError && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Não foi possível buscar candidatos.
            </p>
          )}

          {!isLoading && !hasError && options.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Nenhum resultado
            </p>
          )}

          {!isLoading &&
            !hasError &&
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span>{option.label}</span>
                {option.subtitle != null && (
                  <span className="text-xs text-muted-foreground">
                    {option.subtitle}
                  </span>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

async function loadCandidates(
  kind: CandidateKind,
  term: string,
  language: CatalogSearchLanguage | undefined,
): Promise<CandidateOption[]> {
  if (kind === "keyword") {
    const page = await MovieCatalogSearchService.searchKeywords({ query: term });
    return page.results.map((hit) => ({ id: hit.id, label: hit.name }));
  }

  const page = await MovieCatalogSearchService.searchPeople({
    query: term,
    language,
  });

  return page.results.map((hit) => {
    const subtitle = hit.knownForDepartment ?? hit.knownFor[0]?.title;
    return { id: hit.id, label: hit.name, subtitle };
  });
}

function optionsToLabels(
  foundOptions: CandidateOption[],
): Record<number, string> {
  const labels: Record<number, string> = {};
  for (const option of foundOptions) {
    labels[option.id] = option.label;
  }

  return labels;
}
