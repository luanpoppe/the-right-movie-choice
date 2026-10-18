import { useState } from "react";
import { format, isValid, parse } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const DATE_INPUT_FORMAT = "yyyy-MM-dd";

export class DatePickerUtils {
  static toDate(value: string): Date | undefined {
    const trimmedValue = value.trim();
    if (trimmedValue === "") {
      return undefined;
    }

    const parsedDate = parse(trimmedValue, DATE_INPUT_FORMAT, new Date());
    return isValid(parsedDate) ? parsedDate : undefined;
  }

  static toInputString(date: Date): string {
    return format(date, DATE_INPUT_FORMAT);
  }
}

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = DatePickerUtils.toDate(value);
  const hasValue = selectedDate !== undefined;

  function handleSelect(date: Date | undefined) {
    onChange(date ? DatePickerUtils.toInputString(date) : "");
    setIsOpen(false);
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-expanded={isOpen}
          data-empty={!hasValue}
          className="w-full justify-start gap-2 text-left font-normal tnum data-[empty=true]:text-muted-foreground"
          onClick={() => setIsOpen((open) => !open)}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-80" />
          <span>{hasValue ? format(selectedDate, "PPP") : placeholder}</span>
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 shrink-0 opacity-70 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </Button>
        {hasValue ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear date"
            disabled={disabled}
            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => handleSelect(undefined)}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="rounded-lg border border-border bg-popover p-2 shadow-lg">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate}
          />
        </div>
      ) : null}
    </div>
  );
}
