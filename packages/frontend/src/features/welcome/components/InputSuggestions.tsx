import { MoviesQueryExamplesService } from "@/features/movies/services/movies-query-examples.service";
import { useEffect, useState } from "react";

interface InputSuggestionsProps {
  isLoading: boolean;
}

export function InputSuggestions({ isLoading }: InputSuggestionsProps) {
  const [queryExamples, setQueryExamples] = useState<string[]>([
    "Loading search suggestions...",
  ]);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await MoviesQueryExamplesService.getQueryExamples();

        setQueryExamples(response.queries.map((q) => q.queryExample));
      } catch (error) {
        setQueryExamples([
          "There was an error creating the suggestions of search terms. Try again if you want some creative movie search.",
        ]);
      }
    };

    run();
  }, []);

  return (
    <div className="flex flex-wrap gap-2 justify-center items-center">
      <span className="text-sm text-muted-foreground">Try:</span>
      {queryExamples.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          className="text-sm px-4 py-1.5 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors border border-accent/20"
          onClick={() => {
            const input = document.querySelector(
              'input[name="message"]'
            ) as HTMLInputElement;
            if (input) {
              input.value = suggestion;
              input.focus();
            }
          }}
          disabled={isLoading}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
