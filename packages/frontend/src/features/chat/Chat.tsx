import { ChatForm } from "./components/ChatForm";
import { ChatMessage } from "@/components/chat-message";
import { MovieCard } from "@/components/movie-card";
import { GoBackButton } from "./components/GoBackButton";
import { LoadingScreen } from "./components/LoadingScreen";
import { ChatEntity } from "./entities/chat.entity";

interface ChatProps {
  handleReset: () => void;
  displayMessages: ChatEntity;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function Chat({
  handleSubmit,
  isLoading,
  displayMessages,
  handleReset,
}: ChatProps) {
  return (
    <div className="flex-1 flex flex-col container mx-auto max-w-5xl px-6 py-8">
      <GoBackButton handleReset={handleReset} />

      <div className="flex-1 space-y-8 mb-6">
        {displayMessages.map(({ from, message, movies }, i) => (
          <div key={i} className="space-y-6">
            <ChatMessage role={from} content={message} />

            {movies && (
              <div className="grid gap-5 md:grid-cols-3">
                {movies.map((m) => (
                  <MovieCard key={`${m.title} - ${m.releaseYear}`} movie={m} />
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && <LoadingScreen />}
      </div>

      <ChatForm handleSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
