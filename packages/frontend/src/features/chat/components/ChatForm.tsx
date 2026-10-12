import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExcludeWatchedToggle } from "@/features/chat/components/ExcludeWatchedToggle";
import { GuestLockBanner } from "@/features/movies/components/guest-lock-banner";

interface ChatFormProps {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isGuestLocked?: boolean;
  excludeWatched: boolean;
  onExcludeWatchedChange: (value: boolean) => void;
  hasAccessToken: boolean;
}

export function ChatForm({
  isLoading,
  handleSubmit,
  isGuestLocked = false,
  excludeWatched,
  onExcludeWatchedChange,
  hasAccessToken,
}: ChatFormProps) {
  const isDisabled = isLoading || isGuestLocked;

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 bg-background/80 backdrop-blur-xl pt-6 pb-4 space-y-3"
    >
      {isGuestLocked && <GuestLockBanner />}
      <ExcludeWatchedToggle
        showToggle={hasAccessToken}
        excludeWatched={excludeWatched}
        onExcludeWatchedChange={onExcludeWatchedChange}
        isLoading={isLoading}
        isGuestLocked={isGuestLocked}
      />
      <div className="flex gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
        <Input
          name="message"
          placeholder="Describe the type of movie you want to watch..."
          disabled={isDisabled}
          className="flex-1 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={isDisabled}
          size="icon"
          aria-label="Send message"
          className="h-11 w-11 rounded-lg"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
