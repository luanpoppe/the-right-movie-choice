import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CatalogSearchNumberFieldProps {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
}

export function CatalogSearchNumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
}: CatalogSearchNumberFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsedValue = parseOptionalNumber(event.target.value);
    onChange(parsedValue);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        className="h-9"
      />
    </div>
  );
}

function parseOptionalNumber(rawValue: string): number | undefined {
  const trimmedValue = rawValue.trim();
  if (trimmedValue.length === 0) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);
  const isValidNumber = Number.isFinite(parsedValue);
  if (!isValidNumber) {
    return undefined;
  }

  return parsedValue;
}
