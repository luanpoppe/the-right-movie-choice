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

  const checkboxClassName = cn(
    "h-4 w-4 shrink-0 rounded border border-primary text-primary",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
  );

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={toggleId}
        name="excludeWatched"
        checked={excludeWatched}
        onChange={handleChange}
        disabled={isDisabled}
        className={checkboxClassName}
      />
      <Label htmlFor={toggleId} className="text-sm text-muted-foreground">
        Exclude watched movies
      </Label>
    </div>
  );
}
