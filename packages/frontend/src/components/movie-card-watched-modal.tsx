import { useState } from "react";
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
import { UserMovieEntryPatchDTO } from "@/features/movies/dto/user-movie-entry.dto";
import { useUserMovieEntries } from "@/features/movies/context/use-user-movie-entries.hook";

interface MovieCardWatchedModalProps {
  tmdbId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

class MovieCardWatchedModalUtils {
  static buildConfirmPatch(
    ratingInput: string,
    dateInput: string,
  ): UserMovieEntryPatchDTO {
    const patch: UserMovieEntryPatchDTO = { watched: true };

    const rating = MovieCardWatchedModalUtils.parseRating(ratingInput);
    if (rating !== null) {
      patch.rating = rating;
    }

    const watchedAt = MovieCardWatchedModalUtils.parseWatchedAt(dateInput);
    if (watchedAt !== null) {
      patch.watchedAt = watchedAt;
    }

    return patch;
  }

  static parseRating(value: string): number | null {
    const trimmedValue = value.trim();
    if (trimmedValue === "") {
      return null;
    }

    const parsedRating = Number(trimmedValue);
    const isInteger = Number.isInteger(parsedRating);
    const isInRange = parsedRating >= 1 && parsedRating <= 10;
    const isValidRating = isInteger && isInRange;

    if (!isValidRating) {
      return null;
    }

    return parsedRating;
  }

  static parseWatchedAt(value: string): string | null {
    const trimmedValue = value.trim();
    if (trimmedValue === "") {
      return null;
    }

    const isoDate = `${trimmedValue}T00:00:00.000Z`;
    return isoDate;
  }
}

export function MovieCardWatchedModal({
  tmdbId,
  open,
  onOpenChange,
}: MovieCardWatchedModalProps) {
  const { patchEntry, isPatching } = useUserMovieEntries();
  const [ratingInput, setRatingInput] = useState("");
  const [dateInput, setDateInput] = useState("");

  const isCurrentlyPatching = isPatching(tmdbId);

  function resetForm() {
    setRatingInput("");
    setDateInput("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    const patch = MovieCardWatchedModalUtils.buildConfirmPatch(
      ratingInput,
      dateInput,
    );

    await patchEntry(tmdbId, patch);
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Marcar como assistido</DialogTitle>
          <DialogDescription>
            Nota e data são opcionais. Confirme para salvar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor={`watched-rating-${tmdbId}`}>Nota (1–10)</Label>
            <Input
              id={`watched-rating-${tmdbId}`}
              type="number"
              min={1}
              max={10}
              step={1}
              placeholder="Opcional"
              value={ratingInput}
              onChange={(event) => setRatingInput(event.target.value)}
              disabled={isCurrentlyPatching}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`watched-date-${tmdbId}`}>Data assistida</Label>
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
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCurrentlyPatching}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isCurrentlyPatching}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
