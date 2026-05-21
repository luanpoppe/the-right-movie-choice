import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "ai";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 items-start", isUser && "justify-end")}>
      {!isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "rounded-2xl px-5 py-3.5 max-w-[80%] shadow-sm",
          isUser
            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-primary/20"
            : "bg-card/80 backdrop-blur-sm border border-border/50"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center shadow-sm">
          <User className="w-4 h-4 text-accent" />
        </div>
      )}
    </div>
  );
}
