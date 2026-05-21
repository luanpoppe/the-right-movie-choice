import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputSuggestions } from "./InputSuggestions";

interface FormProps {
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function Form({ handleSubmit, isLoading }: FormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Input
          name="message"
          placeholder="What kind of movie are you looking for? (e.g., 'a thrilling sci-fi movie' or 'something funny to watch with friends')"
          disabled={isLoading}
          className="h-16 text-lg rounded-2xl bg-card/80 border-border/50 pr-16 shadow-lg focus-visible:ring-2 focus-visible:ring-primary/20 dark:text-black"
          autoComplete="off"
          autoFocus
        />
        <Button
          type="submit"
          disabled={isLoading}
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl h-12 w-12 bg-gradient-to-br from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      <InputSuggestions isLoading={isLoading} />
    </form>
  );
}
