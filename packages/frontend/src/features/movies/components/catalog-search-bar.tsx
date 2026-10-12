import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type CatalogLanguage = "en-US" | "pt-BR";

interface CatalogSearchBarProps {
  value: string;
  onSearch: (text: string) => void;
  language: CatalogLanguage;
  onLanguageChange: (language: CatalogLanguage) => void;
}

interface LanguageToggleProps {
  language: CatalogLanguage;
  onLanguageChange: (language: CatalogLanguage) => void;
}

interface LanguageOption {
  value: CatalogLanguage;
  label: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "en-US", label: "EN" },
  { value: "pt-BR", label: "PT" },
];

function LanguageToggle({ language, onLanguageChange }: LanguageToggleProps) {
  return (
    <div
      role="group"
      aria-label="Result language"
      className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm"
    >
      {LANGUAGE_OPTIONS.map((option) => {
        const isActive = option.value === language;

        return (
          <Button
            key={option.value}
            type="button"
            variant={isActive ? "default" : "ghost"}
            size="sm"
            aria-pressed={isActive}
            onClick={() => onLanguageChange(option.value)}
            className="rounded-lg"
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

export function CatalogSearchBar({
  value,
  onSearch,
  language,
  onLanguageChange,
}: CatalogSearchBarProps) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(text);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div className="relative flex-1">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search movies by title"
          autoComplete="off"
          className="h-12 rounded-xl border-border bg-card pr-32 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        <Button
          type="submit"
          className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-lg"
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
      <LanguageToggle
        language={language}
        onLanguageChange={onLanguageChange}
      />
    </form>
  );
}
