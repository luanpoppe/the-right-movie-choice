import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/ui/star-rating";
import { useUserMovieEntries } from "@/features/movies/context/use-user-movie-entries.hook";
import { MovieCardWatchedModalUtils } from "@/features/movies/utils/movie-card-watched-modal.utils";

interface MovieCardWatchedModalProps {
  tmdbId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function MovieCardWatchedModal({
  tmdbId,
  open,
  onOpenChange,
  onDeleted,
}: MovieCardWatchedModalProps) {
  const { patchEntry, isPatching, getFlags } = useUserMovieEntries();
  const [ratingInput, setRatingInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const wasOpenRef = useRef(false);

  const flags = getFlags(tmdbId);
  const savedRating = flags.rating;
  const savedWatchedAt = flags.watchedAt;
  const isCurrentlyPatching = isPatching(tmdbId);
  const numericRating = ratingInput === "" ? 0 : Number(ratingInput);

  useEffect(() => {
    const hasJustOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;

    if (!hasJustOpened) {
      return;
    }

    setIsEditing(flags.watched);
    setRatingInput(savedRating === null ? "" : String(savedRating));
    setDateInput(MovieCardWatchedModalUtils.toDateInputValue(savedWatchedAt));
  }, [open, flags.watched, savedRating, savedWatchedAt]);

  function resetForm() {
    setRatingInput("");
    setDateInput("");
    setRatingError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  function handleRatingChange(nextRating: string) {
    setRatingInput(nextRating);
    setRatingError(null);
  }

  function handleRatingSelect(nextRating: number) {
    handleRatingChange(nextRating === 0 ? "" : String(nextRating));
  }

  async function handleSave() {
    const result = MovieCardWatchedModalUtils.buildSavePatch({
      isEditing,
      ratingInput,
      dateInput,
    });

    if (!result.ok) {
      setRatingError(result.error);
      return;
    }

    const didSucceed = await patchEntry(tmdbId, result.patch);
    if (!didSucceed) {
      return;
    }

    resetForm();
    onOpenChange(false);
  }

  async function handleDelete() {
    const deletePatch = MovieCardWatchedModalUtils.buildDeletePatch();
    const didSucceed = await patchEntry(tmdbId, deletePatch);
    if (!didSucceed) {
      return;
    }

    resetForm();
    onDeleted?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Watched" : "Mark as watched"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your rating or date, or delete this entry."
              : "Rating and date are optional. Confirm to save."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground tnum">
                  {numericRating > 0 ? `${numericRating} / 10` : "Not rated"}
                </span>
                {numericRating > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleRatingChange("")}
                    disabled={isCurrentlyPatching}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>
            <StarRating
              value={numericRating}
              onChange={handleRatingSelect}
              max={10}
              label="Rating (1–10)"
              disabled={isCurrentlyPatching}
            />
            {ratingError !== null ? (
              <p className="text-sm text-destructive">{ratingError}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`watched-date-${tmdbId}`}>Date watched</Label>
            <DatePicker
              id={`watched-date-${tmdbId}`}
              value={dateInput}
              onChange={setDateInput}
              disabled={isCurrentlyPatching}
            />
          </div>
        </div>

        <DialogFooter>
          {isEditing ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isCurrentlyPatching}
            >
              Delete
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCurrentlyPatching}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isCurrentlyPatching}
          >
            {isEditing ? "Save" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
