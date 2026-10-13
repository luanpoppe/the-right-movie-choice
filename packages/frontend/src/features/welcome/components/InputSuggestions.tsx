import { MoviesQueryExamplesService } from "@/features/movies/services/movies-query-examples.service";
import { cn, focusRingClassName } from "@/lib/utils";
import { useEffect, useState } from "react";

interface InputSuggestionsProps {
  isLoading: boolean;
  isGuestLocked?: boolean;
}

const LOADING_MESSAGE = "Loading search suggestions...";

export function InputSuggestions({
  isLoading,
  isGuestLocked = false,
}: InputSuggestionsProps) {
  const [queryExamples, setQueryExamples] = useState<string[]>([
    LOADING_MESSAGE,
  ]);
  const [hasError, setHasError] = useState(false);
  const isDisabled = isLoading || isGuestLocked;

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        const response = await MoviesQueryExamplesService.getQueryExamples();
        if (!isActive) {
          return;
        }
        setQueryExamples(response.queries.map((q) => q.queryExample));
      } catch (error) {
        console.error("Error fetching query examples", { error });
        if (!isActive) {
          return;
        }
        setHasError(true);
      }
    };

    run();

    return () => {
      isActive = false;
    };
  }, []);

  function handleSelect(suggestion: string) {
    if (isGuestLocked) {
      return;
    }

    const input = document.querySelector(
      'input[name="message"]',
    ) as HTMLInputElement | null;

    if (!input) {
      return;
    }

    input.value = suggestion;
    input.focus();
  }

  if (hasError) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load search suggestions right now.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
      <span className="shrink-0 text-sm text-muted-foreground">Try:</span>
      {queryExamples.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={isDisabled}
          onClick={() => handleSelect(suggestion)}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary transition-colors hover:bg-primary/20 disabled:pointer-events-none disabled:opacity-50",
            focusRingClassName,
          )}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
