import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExcludeWatchedToggle } from "@/features/chat/components/ExcludeWatchedToggle";
import { GuestLockBanner } from "@/features/movies/components/guest-lock-banner";
import { InputSuggestions } from "./InputSuggestions";

interface FormProps {
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isGuestLocked?: boolean;
  excludeWatched: boolean;
  onExcludeWatchedChange: (value: boolean) => void;
  hasAccessToken: boolean;
}

export function Form({
  handleSubmit,
  isLoading,
  isGuestLocked = false,
  excludeWatched,
  onExcludeWatchedChange,
  hasAccessToken,
}: FormProps) {
  const isDisabled = isLoading || isGuestLocked;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isGuestLocked && <GuestLockBanner />}
      <ExcludeWatchedToggle
        showToggle={hasAccessToken}
        excludeWatched={excludeWatched}
        onExcludeWatchedChange={onExcludeWatchedChange}
        isLoading={isLoading}
        isGuestLocked={isGuestLocked}
      />
      <div className="relative">
        <Input
          name="message"
          placeholder="What kind of movie are you looking for? (e.g., 'a thrilling sci-fi movie' or 'something funny to watch with friends')"
          disabled={isDisabled}
          className="h-16 rounded-xl border-border bg-card/80 pr-16 text-base shadow-lg focus-visible:ring-2 focus-visible:ring-primary/40"
          autoComplete="off"
          autoFocus
        />
        <Button
          type="submit"
          disabled={isDisabled}
          size="icon"
          aria-label="Get recommendations"
          className="absolute right-2 top-1/2 h-12 w-12 -translate-y-1/2 rounded-lg"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      <InputSuggestions isLoading={isLoading} isGuestLocked={isGuestLocked} />
    </form>
  );
}
