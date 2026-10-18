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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
            <Label htmlFor={`watched-rating-${tmdbId}`}>Rating (1–10)</Label>
            <Input
              id={`watched-rating-${tmdbId}`}
              type="number"
              min={1}
              max={10}
              step={1}
              placeholder="Optional"
              value={ratingInput}
              onChange={(event) => handleRatingChange(event.target.value)}
              disabled={isCurrentlyPatching}
            />
            {ratingError !== null ? (
              <p className="text-sm text-destructive">{ratingError}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`watched-date-${tmdbId}`}>Date watched</Label>
            <Input
              id={`watched-date-${tmdbId}`}
              type="date"
              value={dateInput}
              onChange={(event) => setDateInput(event.target.value)}
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
