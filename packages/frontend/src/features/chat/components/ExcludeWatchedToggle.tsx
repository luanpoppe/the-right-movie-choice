import { useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ExcludeWatchedToggleProps {
  showToggle: boolean;
  excludeWatched: boolean;
  onExcludeWatchedChange: (value: boolean) => void;
  isLoading: boolean;
  isGuestLocked?: boolean;
}

export function ExcludeWatchedToggle({
  showToggle,
  excludeWatched,
  onExcludeWatchedChange,
  isLoading,
  isGuestLocked = false,
}: ExcludeWatchedToggleProps) {
  const toggleId = useId();

  if (!showToggle) {
    return null;
  }

  const isDisabled = isLoading || isGuestLocked;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.checked;
    onExcludeWatchedChange(nextValue);
  };

  const labelClassName = cn(
    "inline-flex items-center gap-2.5 rounded-full border border-border/40 bg-card/50 px-3 py-1.5",
    "text-sm font-normal text-muted-foreground shadow-sm backdrop-blur-sm",
    "transition-colors hover:bg-card/70",
    isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
  );

  const switchTrackClassName = cn(
    "relative inline-flex h-5 w-9 shrink-0 rounded-full border border-border/30 bg-muted/60",
    "transition-all duration-200 ease-out",
    "after:pointer-events-none after:absolute after:left-[2px] after:top-[2px]",
    "after:block after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm",
    "after:transition-transform after:duration-200 after:ease-out",
    "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
    "peer-checked:border-primary/40 peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-accent",
    "peer-checked:after:translate-x-4",
    "peer-disabled:cursor-not-allowed",
  );

  return (
    <Label htmlFor={toggleId} className={labelClassName}>
      <input
        type="checkbox"
        id={toggleId}
        name="excludeWatched"
        checked={excludeWatched}
        onChange={handleChange}
        disabled={isDisabled}
        className="peer sr-only"
      />
      <span aria-hidden="true" className={switchTrackClassName} />
      <span>Exclude watched movies</span>
    </Label>
  );
}
