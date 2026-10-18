import { type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExcludeWatchedToggle } from "@/features/chat/components/ExcludeWatchedToggle";
import { GuestLockBanner } from "@/features/movies/components/guest-lock-banner";
import { InputSuggestions } from "./InputSuggestions";

const PROMPT_PLACEHOLDER = "What kind of movie are you looking for?";

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

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const isSendShortcut = event.key === "Enter" && !event.shiftKey;
    if (!isSendShortcut) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

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
        <Textarea
          name="message"
          rows={2}
          placeholder={PROMPT_PLACEHOLDER}
          disabled={isDisabled}
          onKeyDown={handleKeyDown}
          className="min-h-[96px] resize-none rounded-2xl border-primary/25 bg-card py-4 pl-5 pr-20 text-lg placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/50"
          autoComplete="off"
          autoFocus
        />
        <Button
          type="submit"
          disabled={isDisabled}
          size="icon"
          aria-label="Get recommendations"
          className="absolute bottom-3 right-3 h-12 w-12 rounded-xl"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      <InputSuggestions isLoading={isLoading} isGuestLocked={isGuestLocked} />
    </form>
  );
}
