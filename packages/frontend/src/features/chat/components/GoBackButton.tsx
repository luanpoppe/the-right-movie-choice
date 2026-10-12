import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoBackButtonProps {
  handleReset: () => void;
}

export function GoBackButton({ handleReset }: GoBackButtonProps) {
  return (
    <div className="mb-6 flex items-center justify-center border-b border-border pb-4">
      <Button
        onClick={handleReset}
        variant="outline"
        size="sm"
        className="gap-2 rounded-lg"
      >
        <RotateCcw className="h-4 w-4" />
        Start Again
      </Button>
    </div>
  );
}
