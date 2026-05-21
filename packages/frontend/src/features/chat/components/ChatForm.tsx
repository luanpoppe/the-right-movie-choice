import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatFormProps {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function ChatForm({ isLoading, handleSubmit }: ChatFormProps) {
  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 bg-background/80 backdrop-blur-xl pt-6 pb-4"
    >
      <div className="flex gap-3 p-2 rounded-3xl bg-card/80 border border-border/50 shadow-lg">
        <Input
          name="message"
          placeholder="Describe the type of movie you want to watch..."
          disabled={isLoading}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={isLoading}
          size="icon"
          className="rounded-2xl h-11 w-11 bg-gradient-to-br from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
