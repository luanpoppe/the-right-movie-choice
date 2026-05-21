import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoBackButtonProps {
  handleReset: () => void;
}

export function GoBackButton({ handleReset }: GoBackButtonProps) {
  return (
    <div className="flex items-center justify-center mb-6 pb-4 border-b border-border/50">
      <Button
        onClick={handleReset}
        variant="outline"
        size="sm"
        className="rounded-xl gap-2 hover:bg-accent/10 hover:text-accent hover:border-accent/50 transition-colors bg-transparent"
      >
        <RotateCcw className="w-4 h-4" />
        Start Again
      </Button>
    </div>
  );
}
