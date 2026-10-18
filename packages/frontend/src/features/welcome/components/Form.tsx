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
      {isGuestLocked && (
        <div className="mx-auto w-full max-w-[720px]">
          <GuestLockBanner />
        </div>
      )}

      {hasAccessToken && (
        <div className="mx-auto w-full max-w-[720px]">
          <ExcludeWatchedToggle
            showToggle={hasAccessToken}
            excludeWatched={excludeWatched}
            onExcludeWatchedChange={onExcludeWatchedChange}
            isLoading={isLoading}
            isGuestLocked={isGuestLocked}
          />
        </div>
      )}

      <div className="relative mx-auto w-full max-w-[720px]">
        <Input
          name="message"
          placeholder="What kind of movie are you looking for? (e.g., 'a thrilling sci-fi movie' or 'something funny to watch with friends')"
          disabled={isDisabled}
          className="h-20 rounded-2xl border-primary/25 bg-card pr-20 text-lg shadow-[0_20px_60px_-30px_rgb(var(--primary)/0.6)] placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/50"
          autoComplete="off"
          autoFocus
        />
        <Button
          type="submit"
          disabled={isDisabled}
          size="icon"
          aria-label="Get recommendations"
          className="absolute right-3 top-1/2 h-14 w-14 -translate-y-1/2 rounded-xl"
        >
          <Send className="h-6 w-6" />
        </Button>
      </div>

      <InputSuggestions isLoading={isLoading} isGuestLocked={isGuestLocked} />
    </form>
  );
}
